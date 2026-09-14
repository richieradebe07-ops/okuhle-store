/**
 * Real people wearing real OKUHLE, sent in rather than shot in studio.
 *
 * Kept separate from `lookbook()` in lib/products.ts on purpose: that
 * function is strictly one entry per photographed, purchasable colourway and
 * links straight to `/shop/<id>`. These shots are candid and not all of them
 * show a piece that is currently in the catalogue — linking one to the wrong
 * product page would be worse than not linking it at all, so these render
 * without a `href`.
 */
export type CommunityShot = {
  src: string;
  alt: string;
};

export const communityShots: CommunityShot[] = [
  {
    src: "/gallery/community/toddler-yellow-longsleeve-outdoor.jpg",
    alt: "A young OKUHLE fan in the yellow long-sleeve, out on the hillside in Mvundlweni",
  },
  {
    src: "/gallery/community/toddler-yellow-longsleeve-indoor.jpg",
    alt: "The yellow OKUHLE long-sleeve, indoors",
  },
  {
    src: "/gallery/community/toddler-yellow-longsleeve-playing.jpg",
    alt: "The yellow OKUHLE long-sleeve, out and about",
  },
  {
    src: "/gallery/community/okuhle-tee-hillside.jpg",
    alt: "The OKUHLE tee, out on the hillside overlooking Pietermaritzburg",
  },
  {
    src: "/gallery/community/terminator-tee-back.jpg",
    alt: "The back print on the OKUHLE Terminator tee",
  },
  {
    src: "/gallery/community/terminator-tee-front.jpg",
    alt: "The OKUHLE Terminator tee, front on",
  },
];
