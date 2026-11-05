// Shared UI text for the demo site (NL default, FR, EN). Keys with {x} are filled by t().
const I18N = {
  nl: {
    brandTag: "Autoruiten", demo: "UCP-demo · fictief · geen echte betalingen", bookings: "Alle boekingen", manage: "Beheer je afspraak", bookNow: "Maak nu je afspraak",
    heroTitle: "Autoruitschade?<br>Wij helpen je graag verder!", heroText: "Geregeld in 5 min. Verzekerd tegen glasschade? Dan hoef je bij ons meestal niets te betalen.",
    usp: ["Levenslange garantie", "Ruiten van originele kwaliteit", "24/7 bereikbaar", "Service Center op minder dan 20 min."],
    steps: ["Dienst", "Voertuig & verzekering", "Service Center", "Datum & uur", "Bevestigen"],
    whatFix: "Wat moet er hersteld worden?", yourVehicle: "Je voertuig", plate: "Nummerplaat", insuredQ: "Ben je verzekerd tegen glasschade?",
    insYes: "Ja, via mijn verzekering", insNo: "Nee, ik betaal zelf", insurer: "Verzekeringsmaatschappij",
    insYesNote: "Dan is het meestal gratis. Wij brengen je verzekeraar op de hoogte en regelen het papierwerk en de betaling.",
    insNoNote: "Je betaalt de prijs van de dienst. Voor vervangingen is de getoonde prijs een schatting; de definitieve offerte volgt.",
    whereQ: "Waar wil je geholpen worden?", pickSlot: "Kies een dag en uur", confirmPay: "Bevestig je afspraak",
    name: "Naam", phone: "Telefoon", email: "E-mail", payOk: "Mock Pay: betaling goedkeuren", payNo: "Mock Pay: betaling weigeren",
    confirmBtn: "Bevestig afspraak", payBtn: "Betaal {x} voorschot en bevestig", payLater: "Het saldo betaal je op de afspraak.", insuredNothing: "Niets te betalen: je verzekeraar wordt gefactureerd.",
    back: "← Terug", next: "Verder →", summary: "Jouw afspraak", nothing: "Nog niets gekozen.", service: "Dienst", where: "Waar", when: "Wanneer",
    totalVat: "Totaal (incl. btw)", deposit: "Voorschot nu (20%)", insurerBilled: "Gefactureerd aan verzekeraar", estimate: "schatting", walkIn: "Zonder afspraak mogelijk", mobile: "Aan huis mogelijk",
    booked: "Je afspraak is bevestigd!", ref: "Referentie", paidDeposit: "Voorschot betaald", balance: "Saldo op afspraak", again: "Nog een afspraak maken", manageLink: "Afspraak wijzigen of annuleren",
    provinces: { "Antwerpen": "Antwerpen", "Brussel": "Brussel", "Oost-Vlaanderen": "Oost-Vlaanderen", "Limburg": "Limburg", "Henegouwen": "Henegouwen", "Luik": "Luik", "Aan huis": "Aan huis" },
    homeTitle: "Bij jou thuis of op het werk", homeAddr: "Wij komen naar jou", chipMin: "±{x} min",
    log: "Protocollog", logNote: "Elke actie is een UCP-achtige API-oproep. Klik om uit te klappen.", clear: "wissen",
    msg: { missing_service: "Kies een dienst", missing_plate: "Nummerplaat vereist", invalid_plate: "Belgische nummerplaat verwacht, bv. 1-ABC-123", missing_location: "Kies een Service Center", not_mobile: "Deze dienst kan niet aan huis", missing_slot: "Kies een dag en uur", invalid_slot: "Dit moment is niet boekbaar", slot_taken: "Dit moment is net bezet, kies een ander", missing_contact: "Naam, e-mail en telefoon vereist", invalid_email: "Ongeldig e-mailadres", missing_insurance: "Geef aan of het een verzekeringsdossier is", missing_insurer: "Verzekeringsmaatschappij vereist" },
    svc: { chip_repair: ["Sterretje in voorruit herstellen", "Kleiner dan een stuk van 2 euro en meer dan 6 cm van de rand. Levenslange garantie."], windscreen: ["Voorruit vervangen", "Ruit van originele kwaliteit, geplaatst en afgedicht."], side_window: ["Zijruit vervangen", "Een kapotte zijruit moet altijd vervangen worden."], rear_window: ["Achterruit vervangen", "Inclusief aansluiting van de verwarming."], panoramic_roof: ["Panoramisch dak vervangen", "Vervanging van het glazen dak."], adas: ["Herkalibratie camera's en sensoren", "Herkalibratie van rijhulpsystemen na ruitwerk."] },
    manageTitle: "Beheer je afspraak", manageText: "Vul je referentie en nummerplaat in.", find: "Zoek afspraak", notFound: "Geen afspraak gevonden met die referentie en nummerplaat.",
    reschedule: "Nieuw moment kiezen", cancelBooking: "Afspraak annuleren", confirmCancel: "Afspraak annuleren?", saved: "Afspraak gewijzigd.", canceled: "Afspraak geannuleerd.", status: "Status", save: "Opslaan",
    adminTitle: "Alle boekingen", adminNote: "Publieke demopagina: alle gegevens zijn fictief. Ververst elke 10 seconden.", filter: "Filter op plaat, naam, referentie…", refresh: "Vernieuwen", cancel: "Annuleer", none: "Nog geen boekingen.",
  },
  fr: {
    brandTag: "Vitrages auto", demo: "Démo UCP · fictif · aucun vrai paiement", bookings: "Toutes les réservations", manage: "Gérer mon rendez-vous", bookNow: "Prenez rendez-vous",
    heroTitle: "Dégât à votre vitrage ?<br>Nous vous aidons avec plaisir !", heroText: "Réglé en 5 min. Assuré contre le bris de glace ? Alors vous n'avez généralement rien à payer.",
    usp: ["Garantie à vie", "Vitrages de qualité d'origine", "Joignable 24/7", "Un centre à moins de 20 min."],
    steps: ["Service", "Véhicule & assurance", "Centre", "Date & heure", "Confirmer"],
    whatFix: "Que faut-il réparer ?", yourVehicle: "Votre véhicule", plate: "Plaque d'immatriculation", insuredQ: "Êtes-vous assuré contre le bris de glace ?",
    insYes: "Oui, via mon assurance", insNo: "Non, je paie moi-même", insurer: "Compagnie d'assurance",
    insYesNote: "C'est alors généralement gratuit. Nous prévenons votre assureur et gérons la paperasse et le paiement.",
    insNoNote: "Vous payez le prix du service. Pour un remplacement, le prix affiché est une estimation ; le devis définitif suit.",
    whereQ: "Où souhaitez-vous être aidé ?", pickSlot: "Choisissez un jour et une heure", confirmPay: "Confirmez votre rendez-vous",
    name: "Nom", phone: "Téléphone", email: "E-mail", payOk: "Mock Pay : accepter le paiement", payNo: "Mock Pay : refuser le paiement",
    confirmBtn: "Confirmer le rendez-vous", payBtn: "Payer {x} d'acompte et confirmer", payLater: "Le solde se règle au rendez-vous.", insuredNothing: "Rien à payer : votre assureur est facturé.",
    back: "← Retour", next: "Continuer →", summary: "Votre rendez-vous", nothing: "Rien de choisi.", service: "Service", where: "Où", when: "Quand",
    totalVat: "Total (TVA incl.)", deposit: "Acompte maintenant (20%)", insurerBilled: "Facturé à l'assureur", estimate: "estimation", walkIn: "Sans rendez-vous possible", mobile: "Possible à domicile",
    booked: "Votre rendez-vous est confirmé !", ref: "Référence", paidDeposit: "Acompte payé", balance: "Solde au rendez-vous", again: "Prendre un autre rendez-vous", manageLink: "Modifier ou annuler le rendez-vous",
    provinces: { "Antwerpen": "Anvers", "Brussel": "Bruxelles", "Oost-Vlaanderen": "Flandre orientale", "Limburg": "Limbourg", "Henegouwen": "Hainaut", "Luik": "Liège", "Aan huis": "À domicile" },
    homeTitle: "Chez vous ou au travail", homeAddr: "Nous venons chez vous", chipMin: "±{x} min",
    log: "Journal du protocole", logNote: "Chaque action est un appel d'API de type UCP. Cliquez pour développer.", clear: "effacer",
    msg: { missing_service: "Choisissez un service", missing_plate: "Plaque requise", invalid_plate: "Plaque belge attendue, p. ex. 1-ABC-123", missing_location: "Choisissez un centre", not_mobile: "Ce service n'est pas possible à domicile", missing_slot: "Choisissez un jour et une heure", invalid_slot: "Ce créneau n'est pas réservable", slot_taken: "Ce créneau vient d'être pris, choisissez-en un autre", missing_contact: "Nom, e-mail et téléphone requis", invalid_email: "Adresse e-mail invalide", missing_insurance: "Indiquez s'il s'agit d'un dossier d'assurance", missing_insurer: "Compagnie d'assurance requise" },
    svc: { chip_repair: ["Réparer un impact dans le pare-brise", "Plus petit qu'une pièce de 2 € et à plus de 6 cm du bord. Garantie à vie."], windscreen: ["Remplacer le pare-brise", "Vitrage de qualité d'origine, posé et collé."], side_window: ["Remplacer une vitre latérale", "Une vitre latérale cassée doit toujours être remplacée."], rear_window: ["Remplacer la lunette arrière", "Y compris le raccordement du dégivrage."], panoramic_roof: ["Remplacer le toit panoramique", "Remplacement du toit en verre."], adas: ["Recalibrage caméras et capteurs", "Recalibrage des aides à la conduite après travaux sur vitrage."] },
    manageTitle: "Gérer mon rendez-vous", manageText: "Entrez votre référence et votre plaque.", find: "Chercher", notFound: "Aucun rendez-vous pour cette référence et cette plaque.",
    reschedule: "Choisir un autre moment", cancelBooking: "Annuler le rendez-vous", confirmCancel: "Annuler le rendez-vous ?", saved: "Rendez-vous modifié.", canceled: "Rendez-vous annulé.", status: "Statut", save: "Enregistrer",
    adminTitle: "Toutes les réservations", adminNote: "Page de démo publique : toutes les données sont fictives. Actualisation toutes les 10 secondes.", filter: "Filtrer par plaque, nom, référence…", refresh: "Actualiser", cancel: "Annuler", none: "Aucune réservation.",
  },
};
I18N.en = {
  ...I18N.fr,
  brandTag: "Car glass", demo: "UCP demo · fictional · no real payments", bookings: "All bookings", manage: "Manage your appointment", bookNow: "Book your appointment",
  heroTitle: "Car glass damage?<br>We're happy to help!", heroText: "Sorted in 5 min. Insured against glass damage? Then you usually pay nothing.",
  usp: ["Lifetime guarantee", "Original-quality glass", "Reachable 24/7", "A centre within 20 min."],
  steps: ["Service", "Vehicle & insurance", "Centre", "Date & time", "Confirm"],
  whatFix: "What needs fixing?", yourVehicle: "Your vehicle", plate: "Licence plate", insuredQ: "Are you insured against glass damage?",
  insYes: "Yes, through my insurance", insNo: "No, I pay myself", insurer: "Insurance company",
  insYesNote: "Then it is usually free. We notify your insurer and handle the paperwork and payment.",
  insNoNote: "You pay the service price. For replacements the price shown is an estimate; a final quote follows.",
  whereQ: "Where should we help you?", pickSlot: "Pick a day and time", confirmPay: "Confirm your appointment",
  name: "Name", phone: "Phone", email: "Email", payOk: "Mock Pay: approve payment", payNo: "Mock Pay: decline payment",
  confirmBtn: "Confirm appointment", payBtn: "Pay {x} deposit & confirm", payLater: "You pay the balance at the appointment.", insuredNothing: "Nothing to pay: your insurer is billed.",
  back: "← Back", next: "Continue →", summary: "Your appointment", nothing: "Nothing selected yet.", service: "Service", where: "Where", when: "When",
  totalVat: "Total (incl. VAT)", deposit: "Deposit now (20%)", insurerBilled: "Billed to insurer", estimate: "estimate", walkIn: "Walk-in possible", mobile: "At home possible",
  booked: "Your appointment is confirmed!", ref: "Reference", paidDeposit: "Deposit paid", balance: "Balance at appointment", again: "Book another appointment", manageLink: "Change or cancel appointment",
  provinces: { "Antwerpen": "Antwerp", "Brussel": "Brussels", "Oost-Vlaanderen": "East Flanders", "Limburg": "Limburg", "Henegouwen": "Hainaut", "Luik": "Liège", "Aan huis": "At home" },
  homeTitle: "At home or at work", homeAddr: "We come to you",
  log: "Protocol log", logNote: "Every action is a UCP-style API call. Click to expand.", clear: "clear",
  msg: { missing_service: "Choose a service", missing_plate: "Licence plate required", invalid_plate: "Belgian plate expected, e.g. 1-ABC-123", missing_location: "Choose a centre", not_mobile: "This service cannot be done at your location", missing_slot: "Choose a day and time", invalid_slot: "Slot is not bookable", slot_taken: "That slot was just taken, pick another", missing_contact: "Name, email and phone required", invalid_email: "Invalid email address", missing_insurance: "Say whether this is an insurance claim", missing_insurer: "Insurance company required" },
  svc: { chip_repair: ["Repair a stone chip", "Smaller than a €2 coin and more than 6 cm from the edge. Lifetime guarantee."], windscreen: ["Replace windscreen", "Original-quality glass, fitted and sealed."], side_window: ["Replace side window", "A broken side window must always be replaced."], rear_window: ["Replace rear window", "Including heating element connection."], panoramic_roof: ["Replace panoramic roof", "Glass roof replacement."], adas: ["Recalibrate cameras & sensors", "Driver-assistance recalibration after glass work."] },
  manageTitle: "Manage your appointment", manageText: "Enter your reference and licence plate.", find: "Find appointment", notFound: "No appointment matches that reference and plate.",
  reschedule: "Choose a new time", cancelBooking: "Cancel appointment", confirmCancel: "Cancel this appointment?", saved: "Appointment changed.", canceled: "Appointment canceled.", status: "Status", save: "Save",
  adminTitle: "All bookings", adminNote: "Public demo page: all data is fictional. Refreshes every 10 seconds.", filter: "Filter by plate, name, reference…", refresh: "Refresh", cancel: "Cancel", none: "No bookings yet.",
};

let LANG = localStorage.getItem("lang") || (navigator.language || "nl").slice(0, 2);
if (!I18N[LANG]) LANG = "nl";
const T = () => I18N[LANG];
const t = (key, vars = {}) => String(T()[key] ?? I18N.nl[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (c) => `€${(c / 100).toFixed(2).replace(".", ",")}`;
const dateLabel = (d) => new Date(d + "T12:00").toLocaleDateString({ nl: "nl-BE", fr: "fr-BE", en: "en-GB" }[LANG], { weekday: "short", day: "numeric", month: "short" });
function langSwitcher() {
  return ["nl", "fr", "en"].map((l) => `<button class="btn btn-xs ${l === LANG ? "bg-white text-black" : "btn-ghost text-white"}" data-lang="${l}">${l.toUpperCase()}</button>`).join("");
}
function setLang(l) { LANG = l; localStorage.setItem("lang", l); document.documentElement.lang = l; }
