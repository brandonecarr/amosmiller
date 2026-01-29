-- Trigger to automatically create a profile when a new user signs up

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to get the current user's store credit balance
CREATE OR REPLACE FUNCTION public.get_store_credit_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    balance DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM store_credits
    WHERE user_id = user_uuid;
    RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM profiles
    WHERE id = user_uuid;
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
