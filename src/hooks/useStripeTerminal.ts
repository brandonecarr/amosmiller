"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripeTerminal, Terminal, Reader } from "@stripe/terminal-js";
import { createTerminalPaymentIntent, cancelTerminalPayment } from "@/lib/stripe/terminal";

interface UseStripeTerminalOptions {
  onConnectionStatusChange?: (status: string) => void;
  onPaymentStatusChange?: (status: string) => void;
}

export function useStripeTerminal(options: UseStripeTerminalOptions = {}) {
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [connectedReader, setConnectedReader] = useState<Reader | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("not_connected");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Terminal
  const initializeTerminal = useCallback(async () => {
    try {
      const StripeTerminal = await loadStripeTerminal();

      if (!StripeTerminal) {
        throw new Error("Failed to load Stripe Terminal");
      }

      const term = StripeTerminal.create({
        onFetchConnectionToken: async () => {
          const response = await fetch("/api/stripe/terminal/connection-token", {
            method: "POST",
          });
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          return data.secret;
        },
        onUnexpectedReaderDisconnect: () => {
          setConnectedReader(null);
          setConnectionStatus("disconnected");
          options.onConnectionStatusChange?.("disconnected");
        },
      });

      setTerminal(term);
      setConnectionStatus("initialized");
      return term;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize terminal";
      setError(message);
      throw err;
    }
  }, [options]);

  // Discover readers
  const discoverReaders = useCallback(async () => {
    if (!terminal) {
      await initializeTerminal();
    }

    const term = terminal || (await initializeTerminal());

    try {
      setConnectionStatus("discovering");
      const discoverResult = await term.discoverReaders({
        simulated: process.env.NODE_ENV === "development",
      });

      if ("error" in discoverResult) {
        throw new Error(discoverResult.error.message);
      }

      return discoverResult.discoveredReaders;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to discover readers";
      setError(message);
      throw err;
    }
  }, [terminal, initializeTerminal]);

  // Connect to a reader
  const connectReader = useCallback(
    async (reader: Reader) => {
      if (!terminal) {
        throw new Error("Terminal not initialized");
      }

      try {
        setConnectionStatus("connecting");
        const connectResult = await terminal.connectReader(reader);

        if ("error" in connectResult) {
          throw new Error(connectResult.error.message);
        }

        setConnectedReader(connectResult.reader);
        setConnectionStatus("connected");
        options.onConnectionStatusChange?.("connected");

        return connectResult.reader;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to connect to reader";
        setError(message);
        setConnectionStatus("connection_failed");
        throw err;
      }
    },
    [terminal, options]
  );

  // Disconnect from reader
  const disconnectReader = useCallback(async () => {
    if (!terminal) return;

    try {
      await terminal.disconnectReader();
      setConnectedReader(null);
      setConnectionStatus("disconnected");
      options.onConnectionStatusChange?.("disconnected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      setError(message);
    }
  }, [terminal, options]);

  // Collect payment
  const collectPayment = useCallback(
    async (amount: number, metadata?: Record<string, string>) => {
      if (!terminal || !connectedReader) {
        throw new Error("Not connected to a reader");
      }

      setIsProcessingPayment(true);
      setError(null);
      options.onPaymentStatusChange?.("creating_intent");

      try {
        // Create payment intent
        const intentResult = await createTerminalPaymentIntent(amount, metadata);

        if (intentResult.error || !intentResult.clientSecret) {
          throw new Error(intentResult.error || "Failed to create payment intent");
        }

        options.onPaymentStatusChange?.("collecting_payment");

        // Collect payment method
        const collectResult = await terminal.collectPaymentMethod(intentResult.clientSecret);

        if ("error" in collectResult) {
          throw new Error(collectResult.error.message);
        }

        options.onPaymentStatusChange?.("processing_payment");

        // Confirm payment
        const confirmResult = await terminal.processPayment(collectResult.paymentIntent);

        if ("error" in confirmResult) {
          throw new Error(confirmResult.error.message);
        }

        if (confirmResult.paymentIntent.status !== "succeeded") {
          throw new Error(`Payment failed with status: ${confirmResult.paymentIntent.status}`);
        }

        options.onPaymentStatusChange?.("payment_complete");

        return {
          success: true,
          paymentIntentId: confirmResult.paymentIntent.id,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed";
        setError(message);
        options.onPaymentStatusChange?.("payment_failed");
        throw err;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [terminal, connectedReader, options]
  );

  // Cancel current payment
  const cancelPayment = useCallback(async () => {
    if (!terminal) return;

    try {
      await terminal.cancelCollectPaymentMethod();
      setIsProcessingPayment(false);
      options.onPaymentStatusChange?.("payment_cancelled");
    } catch (err) {
      // Ignore cancellation errors
    }
  }, [terminal, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (terminal && connectedReader) {
        terminal.disconnectReader().catch(() => {});
      }
    };
  }, [terminal, connectedReader]);

  return {
    terminal,
    connectedReader,
    connectionStatus,
    isProcessingPayment,
    error,
    initializeTerminal,
    discoverReaders,
    connectReader,
    disconnectReader,
    collectPayment,
    cancelPayment,
  };
}
