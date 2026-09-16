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
  {
    src: "/gallery/community/gold-emblem-tee-hillside-front.jpg",
    alt: "The gold-emblem OKUHLE tee, out on the hillside overlooking Pietermaritzburg",
  },
  {
    src: "/gallery/community/ohy-back-print-hillside.jpg",
    alt: "The OHY back print, out on the hillside overlooking Pietermaritzburg",
  },
  {
    src: "/gallery/community/gold-emblem-tee-brick-wall-front.jpg",
    alt: "The gold-emblem OKUHLE tee, out and about",
  },
  {
    src: "/gallery/community/gold-emblem-tee-brick-wall-side.jpg",
    alt: "The gold-emblem OKUHLE tee, out and about",
  },
  {
    src: "/gallery/community/at-the-beach.jpg",
    alt: "OKUHLE, out at the beach",
  },
  {
    src: "/gallery/community/okuhle-polo-pavilion-westville.jpg",
    alt: "The OKUHLE polo, out at The Pavilion in Westville",
  },
  {
    src: "/gallery/community/okuhle-polo-pavilion-westville-2.jpg",
    alt: "The OKUHLE polo, out at The Pavilion in Westville",
  },
  {
    src: "/gallery/community/grey-emblem-tee-indoors.jpg",
    alt: "The grey-emblem OKUHLE tee, indoors",
  },
  {
    src: "/gallery/community/grey-emblem-tee-indoors-side.jpg",
    alt: "The grey-emblem OKUHLE tee, indoors",
  },
  {
    src: "/gallery/community/grey-emblem-tee-outdoor-jacket.jpg",
    alt: "The grey-emblem OKUHLE tee, out and about",
  },
  {
    src: "/gallery/community/grey-emblem-tee-outdoor-jacket-2.jpg",
    alt: "The grey-emblem OKUHLE tee, out and about",
  },
  {
    src: "/gallery/community/grey-emblem-tee-walking.jpg",
    alt: "The grey-emblem OKUHLE tee, out and about",
  },
  {
    src: "/gallery/community/pink-tee-storefront.jpg",
    alt: "The OKUHLE tee in pink, out and about",
  },
  {
    src: "/gallery/community/okuhle-shorts-hedge.jpg",
    alt: "OKUHLE, out and about",
  },
  {
    src: "/gallery/community/toddler-gold-emblem-tee.jpg",
    alt: "A young OKUHLE fan in the gold-emblem tee",
  },
];
