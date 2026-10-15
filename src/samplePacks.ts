// Sample packs (sold / given away on BeatStars). Shown in the Sample Packs
// section of Producer Tools (/tools); each card links straight to the pack's
// BeatStars sound kit page. Titles, descriptions, and cover art are from each
// BeatStars listing; covers are saved locally in public/sample-packs/.

export type SamplePack = {
  id: string;
  name: string;
  price: string; // "" = free
  url: string;
  image: string;
  description: string;
  contents?: { label: string; count: string }[];
};

export const SAMPLE_PACKS: SamplePack[] = [
  {
    id: "wav-pack-v1",
    name: "The Wav Pack V.1",
    price: "",
    url: "https://www.beatstars.com/genwav/sound-kits/192047",
    image: "/sample-packs/wav-pack-v1.jpg",
    description:
      "gen.wav's first official sample pack. Live acoustic and electric guitar loops, Arturia MicroFreak original chords and melodies, trap, reggaeton, and R&B drum one-shots and loops, live electric P-bass and SubLab synth bass loops and one-shots, FX, original vocal samples, Analog Lab V pads, and more."
  },
  {
    id: "solar-flares",
    name: "Solar Flares",
    price: "",
    url: "https://www.beatstars.com/genwav/sound-kits/254955",
    image: "/sample-packs/solar-flares.jpg",
    description:
      "Solar Flares by gen.wav, KHR!S João, Jo Merino, & Alex Davila. A free sample pack for trap, R&B, and reggaeton — songstarters, FX, drum loops, and live percussion."
  },
  {
    id: "wav-pack-vol-2",
    name: "The Wav Pack Vol. II",
    price: "$20",
    url: "https://www.beatstars.com/genwav/sound-kits/236319",
    image: "/sample-packs/wav-pack-vol-2.jpg",
    description:
      "A multi kit for producers of any genre with a Latin and hip hop focus. Featuring gen.wav's signature rim snare, original synthesized effects, synth one-shots, original piano and live guitar loops, and a few loops by KHR!S João. Some of these sounds are used in gen.wav's upcoming releases — all royalty free.",
    contents: [
      { label: "Guitar loops", count: "30" },
      { label: "Synth / piano loops", count: "24+" },
      { label: "FX", count: "11" },
      { label: "Drum loops", count: "30" }
    ]
  }
];
