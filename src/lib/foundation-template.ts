import type { Locale, StepCategory } from "./constants";

/**
 * Recommended founding checklist. Written for a French "association loi 1901",
 * but phrased so it is useful elsewhere. Every step can be edited, skipped or deleted.
 */
type TemplateStep = {
  category: StepCategory;
  resourceUrl?: string;
  en: { title: string; description: string };
  fr: { title: string; description: string };
};

const ASSO_GOUV = "https://www.associations.gouv.fr";
const COMPTE_ASSO = "https://lecompteasso.associations.gouv.fr";
const SERVICE_PUBLIC = "https://www.service-public.fr/associations";

export const FOUNDATION_TEMPLATE: TemplateStep[] = [
  {
    category: "PROJECT",
    en: {
      title: "Define the purpose and name of the association",
      description:
        "Write down in a few sentences why the association exists, who it is for and what it will do. Choose a name and check that it is not already used.",
    },
    fr: {
      title: "Définir l'objet et le nom de l'association",
      description:
        "Écrivez en quelques phrases pourquoi l'association existe, pour qui et ce qu'elle va faire. Choisissez un nom et vérifiez qu'il n'est pas déjà utilisé.",
    },
  },
  {
    category: "PROJECT",
    en: {
      title: "Gather the founding members",
      description:
        "An association needs at least two founders. Agree on who will be part of the founding team and on the role each person wants to take.",
    },
    fr: {
      title: "Réunir les membres fondateurs",
      description:
        "Une association nécessite au moins deux fondateurs. Mettez-vous d'accord sur l'équipe fondatrice et sur le rôle que chacun souhaite prendre.",
    },
  },
  {
    category: "PROJECT",
    en: {
      title: "Choose the registered office address",
      description:
        "The head office can be the home of a founder (with their agreement), a partner's premises or a business center.",
    },
    fr: {
      title: "Choisir l'adresse du siège social",
      description:
        "Le siège peut être le domicile d'un fondateur (avec son accord), les locaux d'un partenaire ou une domiciliation.",
    },
  },
  {
    category: "LEGAL",
    resourceUrl: ASSO_GOUV,
    en: {
      title: "Write the statutes",
      description:
        "The statutes are the founding contract: name, purpose, head office, duration, membership conditions, governing bodies (board, general assembly), resources and dissolution.",
    },
    fr: {
      title: "Rédiger les statuts",
      description:
        "Les statuts sont le contrat fondateur : nom, objet, siège, durée, conditions d'adhésion, organes (bureau, assemblée générale), ressources et dissolution.",
    },
  },
  {
    category: "LEGAL",
    en: {
      title: "Draft the internal rules (optional)",
      description:
        "The internal rules complement the statutes with practical details: membership fee amounts, how meetings run, use of equipment, code of conduct…",
    },
    fr: {
      title: "Rédiger le règlement intérieur (facultatif)",
      description:
        "Le règlement intérieur complète les statuts avec les détails pratiques : montant des cotisations, déroulement des réunions, usage du matériel, charte…",
    },
  },
  {
    category: "GOVERNANCE",
    en: {
      title: "Hold the constitutive general assembly",
      description:
        "Bring the founders together to adopt the statutes and elect the first board. Record everything in signed minutes.",
    },
    fr: {
      title: "Tenir l'assemblée générale constitutive",
      description:
        "Réunissez les fondateurs pour adopter les statuts et élire le premier bureau. Consignez tout dans un procès-verbal signé.",
    },
  },
  {
    category: "GOVERNANCE",
    en: {
      title: "Elect the board: president, secretary, treasurer",
      description:
        "Assign the key officer roles. Record them in Agora (Members → board position) so everybody knows who represents the association.",
    },
    fr: {
      title: "Élire le bureau : président, secrétaire, trésorier",
      description:
        "Attribuez les fonctions clés. Renseignez-les dans Agora (Membres → fonction au bureau) pour que chacun sache qui représente l'association.",
    },
  },
  {
    category: "LEGAL",
    resourceUrl: COMPTE_ASSO,
    en: {
      title: "Declare the association to the authorities",
      description:
        "In France, declare it online to the prefecture (greffe des associations) with the statutes and the list of officers. You receive a receipt and an RNA number.",
    },
    fr: {
      title: "Déclarer l'association en préfecture",
      description:
        "Déclarez-la en ligne au greffe des associations avec les statuts et la liste des dirigeants. Vous recevez un récépissé et un numéro RNA.",
    },
  },
  {
    category: "LEGAL",
    resourceUrl: SERVICE_PUBLIC,
    en: {
      title: "Get the publication in the official journal",
      description:
        "In France, the declaration leads to a publication in the JOAFE, which gives the association its legal personality (it can then sign contracts, open an account…).",
    },
    fr: {
      title: "Obtenir la publication au Journal officiel",
      description:
        "La déclaration entraîne une publication au JOAFE, qui donne à l'association sa personnalité juridique (signer des contrats, ouvrir un compte…).",
    },
  },
  {
    category: "OPERATIONS",
    resourceUrl: SERVICE_PUBLIC,
    en: {
      title: "Request a SIRET number if needed",
      description:
        "Needed to apply for public grants, hire staff or run commercial activities. Not required for every association.",
    },
    fr: {
      title: "Demander un numéro SIRET si besoin",
      description:
        "Nécessaire pour demander des subventions publiques, embaucher ou avoir une activité commerciale. Pas obligatoire pour toutes les associations.",
    },
  },
  {
    category: "FINANCE",
    en: {
      title: "Open a bank account",
      description:
        "Usually requires the statutes, the declaration receipt, the minutes of the constitutive assembly and the IDs of the officers.",
    },
    fr: {
      title: "Ouvrir un compte bancaire",
      description:
        "Il faut généralement les statuts, le récépissé de déclaration, le PV de l'assemblée constitutive et les pièces d'identité des dirigeants.",
    },
  },
  {
    category: "OPERATIONS",
    en: {
      title: "Take out liability insurance",
      description:
        "Civil liability insurance protects the association, its volunteers and participants. It is mandatory for some activities (sports, events…).",
    },
    fr: {
      title: "Souscrire une assurance responsabilité civile",
      description:
        "L'assurance responsabilité civile protège l'association, ses bénévoles et participants. Elle est obligatoire pour certaines activités (sport, événements…).",
    },
  },
  {
    category: "FINANCE",
    en: {
      title: "Set the membership fee and the first budget",
      description:
        "Decide on the annual fee (Settings → Association) and prepare a simple budget for the first year: expected income and expenses.",
    },
    fr: {
      title: "Fixer la cotisation et le premier budget",
      description:
        "Décidez du montant de la cotisation annuelle (Paramètres → Association) et préparez un budget simple pour la première année : recettes et dépenses prévues.",
    },
  },
  {
    category: "GOVERNANCE",
    en: {
      title: "Create the poles and name their leads",
      description:
        "Split the work into poles (communication, events, partnerships…) and give each one a lead. Document recurring duties in Structure → Who does what.",
    },
    fr: {
      title: "Créer les pôles et nommer les référents",
      description:
        "Répartissez le travail en pôles (communication, événementiel, partenariats…) avec un référent chacun. Documentez les missions récurrentes dans Structure → Qui fait quoi.",
    },
  },
  {
    category: "OPERATIONS",
    en: {
      title: "Set up the member register and data protection",
      description:
        "Keep an up-to-date list of members (Agora does it for you) and inform members about how their personal data is used (GDPR).",
    },
    fr: {
      title: "Mettre en place le registre des membres et le RGPD",
      description:
        "Tenez une liste à jour des adhérents (Agora le fait pour vous) et informez les membres de l'usage de leurs données personnelles (RGPD).",
    },
  },
  {
    category: "COMMUNICATION",
    en: {
      title: "Create the visual identity and communication channels",
      description:
        "Logo, email address, website or social media pages, and a way for new members to join. Then plan your launch event!",
    },
    fr: {
      title: "Créer l'identité visuelle et les canaux de communication",
      description:
        "Logo, adresse e-mail, site ou réseaux sociaux, et un moyen pour les nouveaux membres d'adhérer. Puis planifiez votre événement de lancement !",
    },
  },
];

export function foundationSteps(locale: Locale) {
  return FOUNDATION_TEMPLATE.map((step, index) => ({
    category: step.category,
    resourceUrl: step.resourceUrl ?? null,
    title: step[locale].title,
    description: step[locale].description,
    order: index,
  }));
}
