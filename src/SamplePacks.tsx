import { useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import BeatStarsIcon from "./BeatStarsIcon";

// Sample packs — sold / given away on BeatStars, so each pack links out to its
// BeatStars sound kit page (free download or checkout happens there). Titles,
// descriptions, and cover art are from each pack's BeatStars listing; covers
// are saved locally in public/sample-packs/.

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

const GREEN = "#68FF00";
const KEYWORDS =
  "free sample pack, free sample packs, free trap sample pack, free reggaeton sample pack, free R&B sample pack, free guitar loops, free drum loops, royalty free loops, songstarters, one shots, sound kit, gen.wav sample pack, Enigma Labs sample packs";

const SamplePacks = () => {
  useEffect(() => {
    document.title = "Sample Packs: Free Trap, R&B & Reggaeton Sound Kits | Enigma Labs Producer Tools";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Sample packs by gen.wav from Enigma Labs: The Wav Pack V.1 and Solar Flares (free), and The Wav Pack Vol. II — guitar, piano, and synth loops, drum loops, one-shots, and FX for trap, R&B, and reggaeton."
    );
    let keywords = document.querySelector('meta[name="keywords"]');
    const created = !keywords;
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    const previous = keywords.getAttribute("content");
    keywords.setAttribute("content", KEYWORDS);

    // /sample-packs#solar-flares etc. (from Producer Tools) jumps to that pack.
    const hashId = window.location.hash.replace("#", "");
    let timer: number | undefined;
    if (SAMPLE_PACKS.some((p) => p.id === hashId)) {
      timer = window.setTimeout(() => document.getElementById(hashId)?.scrollIntoView({ block: "start" }), 150);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
      if (created) keywords?.remove();
      else if (previous !== null) keywords?.setAttribute("content", previous);
    };
  }, []);

  return (
    <Container className="aboutContainer">
      <Row style={{ margin: "1%", marginTop: "1rem" }}>
        <Col xs={12} style={{ textAlign: "center" }}>
          <p style={{ color: GREEN, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            <a href="/tools" style={{ color: GREEN, textDecoration: "none" }}>Producer Tools</a>
          </p>
          <h1 className="subpage-title aboutTitle" style={{ marginTop: 0 }}>Sample Packs</h1>
          <p style={{ color: "#d4d4d4", maxWidth: 600, margin: "0 auto" }}>Loops, one-shots, and songstarters by gen.wav.</p>
        </Col>
      </Row>

      <Row style={{ margin: "1%", marginTop: "2.5rem", marginBottom: "5rem" }}>
        {SAMPLE_PACKS.map((pack) => {
          const free = !pack.price;
          return (
            <Col key={pack.id} id={pack.id} xs={12} md={6} lg={4} style={{ marginBottom: "1.75rem", scrollMarginTop: 90 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  background: "#111",
                  border: "1px solid #2b2b2b",
                  borderRadius: 16,
                  padding: "0.9rem"
                }}
              >
                <a href={pack.url} target="_blank" rel="noopener noreferrer" style={{ position: "relative", display: "block" }}>
                  <img
                    src={pack.image}
                    alt={`${pack.name} sample pack cover`}
                    width={800}
                    height={800}
                    loading="lazy"
                    style={{ display: "block", width: "100%", height: "auto", borderRadius: 10 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: free ? GREEN : "#fff",
                      color: "#000",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      letterSpacing: "0.08em",
                      padding: "0.2rem 0.65rem",
                      borderRadius: "2rem"
                    }}
                  >
                    {free ? "FREE" : pack.price}
                  </span>
                </a>
                <h2 style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 700, margin: "0.9rem 0 0.35rem" }}>{pack.name}</h2>
                <p style={{ color: "#c9c9c9", lineHeight: 1.6, margin: 0 }}>{pack.description}</p>
                {pack.contents ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0" }}>
                    {pack.contents.map((c) => (
                      <li key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid #222", color: "#d4d4d4" }}>
                        <span>{c.label}</span>
                        <strong style={{ color: "#fff" }}>{c.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div style={{ flexGrow: 1 }} />
                <a
                  href={pack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    padding: "0.8rem 1.25rem",
                    borderRadius: "2rem",
                    background: free ? GREEN : "#DF0000",
                    color: free ? "#000" : "#fff",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    textDecoration: "none"
                  }}
                >
                  <BeatStarsIcon size={20} color={free ? "#000" : "#fff"} />
                  {free ? "Download free on BeatStars" : `Buy on BeatStars — ${pack.price}`}
                </a>
              </div>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default SamplePacks;
