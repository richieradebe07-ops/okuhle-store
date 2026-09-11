export type FaqItem = { q: string; a: string };
export type FaqSection = { title: string; items: FaqItem[] };

export const faqs: FaqSection[] = [
  {
    title: "About OKUHLE",
    items: [
      {
        q: "What is OKUHLE?",
        a: "OKUHLE is a streetwear label built in Mvundlweni, Pietermaritzburg. We make golf tees, tees, baggy fits, sweaters and hoodies, each carrying the Okuhle emblem. Everything is made to order and sold directly to you — no middleman, no markup.",
      },
      {
        q: "What does “Okuhle” mean?",
        a: "Okuhle means “something beautiful” in Zulu. It is the whole brief: wear something beautiful, and carry something that means something while you do it.",
      },
      {
        q: "Where are you based, and can I visit?",
        a: "We work out of M70 Road, Mvundlweni, Pietermaritzburg, KwaZulu-Natal. Local collection is welcome — message us on WhatsApp first so we can confirm a time and have your piece ready.",
      },
      {
        q: "What does “made to order” actually mean?",
        a: "We do not hold deep stock in every colour and size. When you order, we confirm your colour and size, then produce your piece. It keeps waste down and lets you pick exactly what you want, at the cost of a short wait.",
      },
    ],
  },
  {
    title: "Sizing & fit",
    items: [
      {
        q: "How do your sizes run?",
        a: "Tees, golf tees, sweaters and hoodies run true to size in a regular fit. The Baggy Tee is oversized by design — order your usual size for the intended drape, not a size down.",
      },
      {
        q: "I am between sizes. Up or down?",
        a: "Size up. Our cotton is mid to heavy weight and settles slightly after the first wash, and most people prefer the extra room across the shoulders.",
      },
      {
        q: "What if the size I ordered does not fit?",
        a: "Message us on WhatsApp within 7 days of receiving it. If the piece is unworn, unwashed and still has its tags, we will arrange an exchange for a different size — you cover the return shipping, we cover sending the new one.",
      },
      {
        q: "Do you make kids or plus sizes?",
        a: "Our standard run is S to XXL. For anything outside that, ask on WhatsApp — we can often accommodate special sizing on a made-to-order basis, with a small adjustment to the price.",
      },
    ],
  },
  {
    title: "Ordering & payment",
    items: [
      {
        q: "How do I place an order?",
        a: "Pick your piece, colour and size, then tap Order. That opens WhatsApp with your selection already written out — send it and we will confirm availability, total and delivery with you directly.",
      },
      {
        q: "What payment methods do you accept?",
        a: "EFT and instant bank transfer, plus card payments through our secure checkout. We will send you the payment details once your order is confirmed.",
      },
      {
        q: "How does lay-by work?",
        a: "Pay your order off over 2 to 3 months. We take a deposit to start production, you settle the balance in agreed instalments, and your piece ships once the final payment clears. No interest, no admin fee.",
      },
      {
        q: "Do you offer bulk or group pricing?",
        a: "Yes. Buy 3 or more tees, golf tees or baggy fits, or 2 or more sweaters or hoodies, and the unit price drops. Team kit, church groups, matric dance crews and small businesses — message us for a quote.",
      },
      {
        q: "Can I customise a piece?",
        a: "Within reason. Colour and size are always yours to choose. For custom emblem placement, names or numbers, ask on WhatsApp before you order so we can confirm what is possible and what it costs.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        q: "How long until my order arrives?",
        a: "Production takes 2 to 3 working days because everything is made to order. Delivery then takes 1 to 2 days in Pietermaritzburg and Durban, 2 to 4 days to Gauteng and other metros, and 3 to 7 days to outlying areas.",
      },
      {
        q: "What does delivery cost?",
        a: "Courier delivery is a flat national rate quoted when we confirm your order. Local collection in Pietermaritzburg is free.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once your parcel is collected by the courier we send you the tracking number on WhatsApp, along with an estimated delivery day.",
      },
      {
        q: "What happens if my parcel is lost or arrives damaged?",
        a: "Tell us within 48 hours of delivery, with photos if the parcel is damaged. We lodge the claim with the courier and remake or refund your order — you are not left carrying a courier's mistake.",
      },
    ],
  },
  {
    title: "Rewards",
    items: [
      {
        q: "Do you have a membership or subscription?",
        a: "No, and deliberately so. We worked out that a monthly fee only pays for itself if you buy several pieces every month, which almost nobody does — it would have cost most people more than it saved them. The rewards are free with an account instead.",
      },
      {
        q: "How do points work?",
        a: "Every R100 you spend earns 1 point, rounded down. 10 points takes R100 off a future order. Points are added automatically when your payment clears — there is no code to enter.",
      },
      {
        q: "Do points expire?",
        a: "After 12 months with no activity on your account, yes. We would rather say that upfront than bury it in the terms.",
      },
      {
        q: "What else do I get with an account?",
        a: "Early access to new drops 48 hours before they go public, 15% off one order during your birthday month, and first notification when a sold-out size is restocked.",
      },
    ],
  },
  {
    title: "Returns & care",
    items: [
      {
        q: "What is your returns policy?",
        a: "Because pieces are made to order, we do not accept change-of-mind returns. If an item arrives faulty, or is not what you ordered, message us within 7 days and we will replace it or refund you in full.",
      },
      {
        q: "How should I wash my Okuhle piece?",
        a: "Cold machine wash inside out with like colours, hang or lay flat to dry in the shade, and keep the iron off the emblem. Do not tumble dry the sweaters or hoodies.",
      },
      {
        q: "Will the emblem crack or fade?",
        a: "Not if you wash it cold and inside out. The emblem is applied to last, but heat is what kills prints — hot washes, tumble dryers and direct ironing are what to avoid.",
      },
    ],
  },
];
