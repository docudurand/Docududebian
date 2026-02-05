const registry = [
  {
    key: "fournisseur-pl",
    label: "Fournisseur PL",
    page: "fournisseur-pl.html",
    filename: "fournisseur_pl.json",
  },
  {
    key: "liens-garantie-retour-pl",
    label: "Liens garantie/retour PL",
    page: "liens-garantie-retour-pl.html",
    filename: "pl_liens_garantie_retour.json",
  },
  {
    key: "fournisseur-vl",
    label: "Fournisseur VL",
    page: "fournisseur-vl.html",
    filename: "fournisseur.json",
  },
  {
    key: "liens-formulaire-garantie",
    label: "Liens formulaire garantie VL",
    page: "liens-formulaire-garantie.html",
    filename: "vl_liens_formulaire_garantie.json",
  },
  {
    key: "retour-fournisseur-garantie-vl",
    label: "Retour fournisseur/garantie VL",
    page: "retour-fournisseur-garantie-vl.html",
    filename: "vl_retour_garantie.json",
  },
  {
    key: "contact-fournisseur",
    label: "Contacts fournisseurs",
    page: "contact-fournisseur.html",
    filename: "contacts_fournisseurs.json",
  },
  {
    key: "demande-ramasse",
    label: "Demande ramasse (fournisseurs)",
    page: "demande-ramasse.html",
    filename: "fournisseur.json",
  },
  {
    key: "site-identification-oe",
    label: "Site identification OE",
    page: "site-identification-oe.html",
    filename: "site_identification_oe.json",
  },
  {
    key: "documents-atelier",
    label: "Documents atelier",
    page: "documents-atelier.html",
    filename: "atelier_data.json",
  },
];

const registryByKey = new Map(registry.map((item) => [item.key, item]));

function getByKey(key) {
  return registryByKey.get(String(key || "").trim()) || null;
}

export { registry, getByKey };
