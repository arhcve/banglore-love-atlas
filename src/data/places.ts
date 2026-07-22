export type LovedPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  url: string;
  note?: string;
};

// All in Koramangala, Bangalore. Coordinates parsed from the shared Google Maps links.
export const PLACES: LovedPlace[] = [
  {
    id: "bobs-bar",
    name: "Bob's Bar",
    lat: 12.9344793,
    lng: 77.6130544,
    url: "https://maps.app.goo.gl/NAU2etyPHNaRbrP5A",
    note: "Koramangala",
  },
  {
    id: "quarter-peter",
    name: "Quarter Peter",
    lat: 12.9349794,
    lng: 77.6138506,
    url: "https://maps.app.goo.gl/KyWVUSxw6xPhTyVm6",
    note: "Koramangala",
  },
  {
    id: "corner-house",
    name: "Corner House Icecreams",
    lat: 12.9362634,
    lng: 77.615153,
    url: "https://maps.app.goo.gl/6uMxDTwh6EpPZpeAA",
    note: "Koramangala",
  },
  {
    id: "truffles",
    name: "Truffles",
    lat: 12.9335323,
    lng: 77.614318,
    url: "https://maps.app.goo.gl/sp5EC9hwsf2gxQar7",
    note: "Koramangala",
  },
  {
    id: "adc",
    name: "ADC — A Dough Cookie",
    lat: 12.9329444,
    lng: 77.6073257,
    url: "https://maps.app.goo.gl/3gryqNqJBoZ8PVeS9",
    note: "Koramangala",
  },
  {
    id: "kannur",
    name: "Kannur Food Point",
    lat: 12.9312906,
    lng: 77.6081997,
    url: "https://maps.app.goo.gl/Rr3T4VSaaJd3oCVs9",
    note: "Koramangala",
  },
  {
    id: "mg-road",
    name: "Mahatma Gandhi Road",
    lat: 12.974724,
    lng: 77.609468,
    url: "https://maps.app.goo.gl/kzeSyYfo1HfiVabk7",
    note: "Bengaluru",
  },
  {
    id: "cubbon-park",
    name: "Cubbon Park",
    lat: 12.9682871,
    lng: 77.5887909,
    url: "https://maps.app.goo.gl/ryvQYnezM8kGHcT1A",
    note: "Bengaluru",
  },
  {
    id: "milano-ice-cream",
    name: "Milano Ice Cream",
    lat: 12.9790343,
    lng: 77.6440204,
    url: "https://maps.app.goo.gl/PXBBqdxGvj396niq7",
    note: "Indiranagar",
  },
  {
    id: "christ-university",
    name: "Christ University",
    lat: 12.9344479,
    lng: 77.6059112,
    url: "https://maps.app.goo.gl/sgVCbzSLqFZw7p8w5",
    note: "Dharmaram College",
  },
];

export const SPOTIFY_PLAYLIST_ID = "158fsKMPt5TzUoGvbQElpL";
