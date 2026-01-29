"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Star,
  Phone,
  Building,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  Address,
  AddressInput,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/actions/addresses";

interface AddressBookProps {
  initialAddresses: Address[];
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export function AddressBook({ initialAddresses }: AddressBookProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<AddressInput>({
    label: "",
    full_name: "",
    company: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
    delivery_instructions: "",
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      label: "",
      full_name: "",
      company: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
      phone: "",
      delivery_instructions: "",
      is_default: false,
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  const openEditForm = (address: Address) => {
    setFormData({
      label: address.label,
      full_name: address.full_name,
      company: address.company || "",
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || "",
      delivery_instructions: address.delivery_instructions || "",
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAddress) {
        const result = await updateAddress(editingAddress.id, formData);
        if (result.data) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddress.id ? result.data : a))
          );
          // If we set this as default, update other addresses
          if (formData.is_default) {
            setAddresses((prev) =>
              prev.map((a) => ({
                ...a,
                is_default: a.id === editingAddress.id,
              }))
            );
          }
        }
      } else {
        const result = await createAddress(formData);
        if (result.data) {
          // If new address is default, update existing addresses
          if (result.data.is_default) {
            setAddresses((prev) =>
              prev.map((a) => ({ ...a, is_default: false }))
            );
          }
          setAddresses((prev) => [result.data, ...prev]);
        }
      }
      resetForm();
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    setLoading(true);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setLoading(true);
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === addressId,
          }))
        );
      }
    } catch (error) {
      console.error("Error setting default:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add Address Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="mb-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      )}

      {/* Address Form */}
      {showForm && (
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h3>
            <button
              onClick={resetForm}
              className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Label"
                placeholder="e.g., Home, Work, Farm"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                required
              />
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Company (optional)"
              placeholder="Company name"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />

            <Input
              label="Address Line 1"
              placeholder="Street address"
              value={formData.address_line1}
              onChange={(e) =>
                setFormData({ ...formData, address_line1: e.target.value })
              }
              required
            />

            <Input
              label="Address Line 2 (optional)"
              placeholder="Apartment, suite, unit, etc."
              value={formData.address_line2}
              onChange={(e) =>
                setFormData({ ...formData, address_line2: e.target.value })
              }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="">Select</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="ZIP Code"
                  placeholder="12345"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Delivery Instructions (optional)
              </label>
              <textarea
                placeholder="Gate code, where to leave packages, etc."
                value={formData.delivery_instructions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_instructions: e.target.value,
                  })
                }
                rows={2}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
              />
              <span className="text-sm text-[var(--color-charcoal)]">
                Set as default address
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={loading}>
                {editingAddress ? "Update Address" : "Save Address"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
            No addresses saved
          </h3>
          <p className="text-[var(--color-muted)] mb-4">
            Add an address to make checkout faster
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white border rounded-xl p-5 relative ${
                address.is_default
                  ? "border-[var(--color-primary-500)] ring-1 ring-[var(--color-primary-200)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              {/* Default Badge */}
              {address.is_default && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs font-medium rounded-full">
                  <Star className="w-3 h-3 fill-current" />
                  Default
                </div>
              )}

              {/* Label */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[var(--color-primary-500)]" />
                <span className="font-semibold text-[var(--color-charcoal)]">
                  {address.label}
                </span>
              </div>

              {/* Address Details */}
              <div className="text-sm text-[var(--color-muted)] space-y-1 mb-4">
                <p className="font-medium text-[var(--color-charcoal)]">
                  {address.full_name}
                </p>
                {address.company && (
                  <p className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {address.company}
                  </p>
                )}
                <p>{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>
                  {address.city}, {address.state} {address.postal_code}
                </p>
                {address.phone && (
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {address.phone}
                  </p>
                )}
                {address.delivery_instructions && (
                  <p className="text-xs italic mt-2 p-2 bg-[var(--color-slate-50)] rounded">
                    {address.delivery_instructions}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditForm(address)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set Default
                  </Button>
                )}
                {deleteConfirm === address.id ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-red-600">Delete?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      isLoading={loading}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(address.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
