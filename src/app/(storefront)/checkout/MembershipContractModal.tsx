"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";

interface MembershipContractModalProps {
  open: boolean;
  onClose: () => void;
}

export function MembershipContractModal({ open, onClose }: MembershipContractModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-heading font-bold text-slate-900">
            Membership Agreement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          <p className="italic text-slate-600">
            &ldquo;With the reading of this membership agreement, I accept the offer made to become
            a member of Amos Miller Organic Farm, LLC (&ldquo;Association&rdquo;)&rdquo;
          </p>

          <p>
            The membership constitutes a personal relationship between the individual and the
            Association. Members agree that purchased products are for personal consumption and
            immediate family household use only. Products cannot be shipped to others outside the
            household, though members may ship to themselves at alternate addresses. The Association
            explicitly states it is not a public entity&mdash;members cannot resell or commercially
            distribute products.
          </p>

          <h3 className="text-base font-heading font-bold text-slate-900">
            Declaration of Purpose (Article 1)
          </h3>

          <p>
            <strong>Objective 1:</strong> The Association maintains it exists to preserve
            constitutional rights and civil liberties of U.S. citizens, citing the Constitution and
            Declaration of Independence as foundational documents.
          </p>

          <p>
            <strong>Objective 2:</strong> The Association asserts First Amendment protections
            regarding free speech, petition, assembly, and the right to gather for lawful purposes
            concerning constitutional rights.
          </p>

          <p className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            &ldquo;IT IS HEREBY Declared that we are exercising our right of &lsquo;freedom of
            association&rsquo; as guaranteed by the 1st and 14th Amendments of the U.S. Constitution
            and equivalent provisions of the various State Constitutions.&rdquo;
          </p>

          <p>
            <strong>Objective 3:</strong> Members retain the right to select representatives and
            skilled members to facilitate product access and delivery.
          </p>

          <p>
            <strong>Objective 4:</strong> The Association proclaims members&apos; freedom to choose
            products and methods for health and wellness: &ldquo;We proclaim and reserve the right to
            include healthy food options that include, but are not limited to, cutting edge
            discoveries.&rdquo;
          </p>

          <p>
            <strong>Objective 5:</strong> The Association&apos;s specific mission involves providing
            high-quality foods using advanced methods. &ldquo;More specifically, the Association
            specializes in raw milk products and grass-fed meats and demands access to foods of our
            choice.&rdquo;
          </p>

          <p>
            <strong>Objective 6:</strong> The Association recognizes any person regardless of race,
            color, or religion who aligns with stated principles.
          </p>

          <h3 className="text-base font-heading font-bold text-slate-900">
            Memorandum of Understanding
          </h3>

          <p>
            Members understand that fellow members provide products as private association members,
            not as licensed wholesalers or retailers. No wholesaler-customer relationship
            exists&mdash;only a member-to-member contractual association exists. Members acknowledge
            they voluntarily changed their legal status from public consumer to private association
            member.
          </p>

          <p>
            Members accept personal responsibility for evaluating product recommendations and risks.
            They agree to hold &ldquo;the Trustee(s), staff and other worker members and the
            Association harmless from any unintentional liability for the results of such
            recommendations and products, except for harm that results from instances of a clear and
            present danger.&rdquo;
          </p>

          <p>
            <strong>Managing Member:</strong> Anke Meyn is identified as the qualified person to
            serve as Managing Member, with authority to select other members for assistance.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">Jurisdictional Claims</h4>

          <p>
            Since the Association is protected by the First and Fourteenth Amendments to the U.S.
            Constitution, it is outside the jurisdiction and authority of Federal and State Agencies
            and Authorities concerning any and all complaints or grievances. All complaints will be
            settled by an Association Committee. Members waive complaint processes and agree that
            violation of any waivers in this membership contract will result in a no contest legal
            proceeding.
          </p>

          <p>The Association does not participate in insurance plans.</p>

          <h4 className="text-sm font-heading font-bold text-slate-900">
            Member Acknowledgments
          </h4>

          <p>
            Members acknowledge the Association is a private membership association under common law
            seeking to help members achieve better health through quality products. Members recognize
            that providers offer products and services that &ldquo;do not necessarily conform to
            conventional products on the market.&rdquo; Informed consent occurs through provider
            discussions.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">
            Privacy and Confidentiality
          </h4>

          <p>
            &ldquo;My activities within the Association are a private matter that I refuse to share
            with State Medical Board(s), the FDA, FTC, State Milk Board(s), USDA, Agricultural
            Board(s) and any other governmental agency without my express specific permission.&rdquo;
          </p>

          <p>
            All records remain Association property regardless of member copies. Members fully agree
            not to file liability lawsuits unless that member has been exposed to a clear and present
            danger of substantive evil.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">Member Sanctions</h4>

          <p>
            The Trustee(s) shall have the right to sanction a member upon unanimous vote of the
            Trustee(s), after a hearing of the facts where the member may be present after
            notification. Sanctions include removal from active membership or imposing special
            conditions on members who discredit or bring harm to the Association in any manner.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">
            Billing and Confidentiality
          </h4>

          <p>
            Personal information is held confidential with no sharing of email, credit card, or
            payment information tolerated. The website ordering platform and images are proprietary to
            Amos Miller Organic Farm LLC.
          </p>

          <p>
            Regarding billing disputes, members agree NOT to file disputes but instead contact{" "}
            <span className="text-orange-500">members@amosmillerorganicfarm.com</span> for mutual
            resolution of charges or replacement goods.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">Membership Terms</h4>

          <p>
            Members enter this agreement freely without pressure or promises. Members affirm they do
            not represent any regulatory agency. Members can withdraw and terminate membership at any
            time.
          </p>

          <p>
            The website content and Article 1 of the Association&apos;s Articles constitute the
            complete agreement superseding any previous agreements. Membership fees entitle members to
            &ldquo;general benefits&rdquo; as declared by Trustee(s).
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">
            Freedom of Association Declaration
          </h4>

          <p className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            &ldquo;I hereby declare that I/we are exercising our right of &lsquo;freedom of
            association&rsquo; as guaranteed by the 1st and 14th Amendments of the U.S. Constitution
            and equivalent provisions of the various State Constitutions.&rdquo;
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">Membership Fee</h4>

          <p>
            Members pay a one-time, non-refundable fee as consideration for membership. Members may
            cancel by notifying the Managing Member at{" "}
            <span className="text-orange-500">members@amosmillerorganicfarm.com</span>.
          </p>

          <h4 className="text-sm font-heading font-bold text-slate-900">Legal Certification</h4>

          <p className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            &ldquo;I do hereby certify, attest and warrant that I have carefully read the above and
            foregoing Miller Organic Farm Contractual Application for Membership and website and I
            fully understand and agree with same. My payment of the membership fee constitutes my
            signature and legal acceptance of this membership contract.&rdquo;
          </p>

          <h3 className="text-base font-heading font-bold text-slate-900">
            The Concept of &ldquo;Liberty&rdquo;
          </h3>

          <p>
            U.S. Supreme Court holdings regarding liberty as guaranteed by the Fifth and Fourteenth
            Amendments&apos; due process clauses enumerate the following rights:
          </p>

          <ol className="list-decimal pl-6 space-y-1">
            <li>Freedom from bodily restraint</li>
            <li>Right of individual contract</li>
            <li>Right to engage in common occupations</li>
            <li>Right to acquire useful knowledge</li>
            <li>Right to marry</li>
            <li>Right to establish a home</li>
            <li>Right to bring up children</li>
            <li>Right to worship according to conscience</li>
            <li>Right to enjoy common-law privileges essential to pursuing happiness</li>
            <li>Right of freedom of Association</li>
          </ol>

          <p>
            The right of freedom of association can be equated with the nine other rights under the
            legal concept of &ldquo;liberty.&rdquo; Citing{" "}
            <em>Lawton v. Steele</em>, freedom of association may not be interfered with under the
            guise of protecting the public interests, arbitrarily interfere with private business, or
            impose unusual and unnecessary restrictions.
          </p>

          <h3 className="text-base font-heading font-bold text-slate-900">
            Public Domain Versus Private Domain
          </h3>

          <p>
            The law distinguishes between <em>mala in se</em> crimes (crimes in themselves like
            murder, rape) and <em>mala prohibita</em> crimes (crimes only because legislation makes
            them so, like practicing without a license).
          </p>

          <p>
            In the private domain of a First Amendment legal membership association, activities that
            may be regulated in the public domain are protected. Citing{" "}
            <em>N.A.A.C.P. v. Button</em>: &ldquo;The &lsquo;modes of&hellip;association protected
            by the First and Fourteenth (are modes) which Virginia may not prohibit.&rdquo;
          </p>

          <p>
            The private domain is described by various U.S. Supreme Court decisions as:
          </p>

          <ul className="list-disc pl-6 space-y-1">
            <li>
              A sanctuary from unjustified interference by the State (
              <em>Pierce v. Society of Sisters</em>)
            </li>
            <li>
              A constitutional shelter (<em>Roberts v. United States</em>)
            </li>
            <li>
              A shield (<em>Roberts v. United States</em>)
            </li>
            <li>
              Domains set apart for free assembly (<em>Thomas v. Collins</em>)
            </li>
            <li>
              A preserve (<em>Baird v. Arizona</em>)
            </li>
          </ul>

          <p>
            The private domain of an association is a sanctuary, constitutional shelter, shield, and
            domain set apart and a preserve according to a number of U.S. Supreme Court decisions.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200 flex-shrink-0">
          <Button onClick={onClose} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
