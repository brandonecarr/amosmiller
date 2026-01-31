"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { MEMBERSHIP_FEE, PRESERVE_AMERICA_FEE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { MembershipContractModal } from "./MembershipContractModal";
import type { MembershipOption } from "@/contexts/CartContext";

interface MembershipSelectorProps {
  selectedOption: MembershipOption;
  onOptionChange: (option: MembershipOption) => void;
  contractAccepted: boolean;
  onContractAcceptedChange: (accepted: boolean) => void;
}

export function MembershipSelector({
  selectedOption,
  onOptionChange,
  contractAccepted,
  onContractAcceptedChange,
}: MembershipSelectorProps) {
  const [contractModalOpen, setContractModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-slate-900">
              Membership Enrollment
            </h2>
            <p className="text-sm text-slate-500">
              Required for first-time members
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Your purchase will help fund the legal cost of the battle to save our farm, and will help
          keep the farm from going under. Kindly choose the membership enrollment that you would like
          to have.
        </p>

        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <strong>Please note:</strong> Currently we are NOT allowed to sell any raw dairy products
          within our home state of PA. We can only provide you with raw dairy if you live outside of
          PA. We appreciate your support of our Farm and farming the way it should be.
        </div>

        {/* Radio Options */}
        <div className="space-y-3 mb-6">
          {/* Preserve America Option */}
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedOption === "preserve-america"
                ? "border-orange-500 bg-orange-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="membership"
              value="preserve-america"
              checked={selectedOption === "preserve-america"}
              onChange={() => onOptionChange("preserve-america")}
              className="mt-1 w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                Preserve America Pumpkin Pie Fundraiser
              </p>
              <p className="text-sm text-slate-500 mt-1">
                $129.00 supporting our Preserve America Pumpkin Pie Fundraiser plus $1.00 Lifetime
                membership fee ({formatCurrency(PRESERVE_AMERICA_FEE)} total). You will receive a 6&quot;
                freshly baked Pumpkin Pie shipped with heartfelt appreciation.
              </p>
              <p className="text-sm font-bold text-slate-900 mt-2">
                {formatCurrency(PRESERVE_AMERICA_FEE)}
              </p>
            </div>
          </label>

          {/* Standard Membership Option */}
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedOption === "standard"
                ? "border-orange-500 bg-orange-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="membership"
              value="standard"
              checked={selectedOption === "standard"}
              onChange={() => onOptionChange("standard")}
              className="mt-1 w-4 h-4 text-orange-500 border-slate-300 focus:ring-orange-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                Non-refundable Lifetime Membership Alone
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Become a lifetime member without supporting the Preserve America fundraiser.
              </p>
              <p className="text-sm font-bold text-slate-900 mt-2">
                {formatCurrency(MEMBERSHIP_FEE)}
              </p>
            </div>
          </label>
        </div>

        {/* Membership Contract Checkbox */}
        <div className="border-t border-slate-200 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={contractAccepted}
              onChange={(e) => onContractAcceptedChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
            />
            <span className="text-sm text-slate-700">
              I&apos;ve read and accept the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setContractModalOpen(true);
                }}
                className="text-orange-500 hover:text-orange-600 underline font-medium"
              >
                Membership Contract
              </button>
              .
            </span>
          </label>
        </div>
      </div>

      <MembershipContractModal
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
      />
    </>
  );
}
