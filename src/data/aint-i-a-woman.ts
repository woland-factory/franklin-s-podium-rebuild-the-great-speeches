import type { Speech } from "../types";

// Sojourner Truth at the 1851 Women's Rights Convention in Akron, Ohio, in the
// version Frances Dana Gage published in 1863. Verbatim historical quotation:
// the dialect, the bracketed aside, and the em-dashes are Gage's as published,
// exempt from the copy sweep.
const sentences: string[] = [
  "Well, children, where there is so much racket there must be something out of kilter.",
  "I think that 'twixt the negroes of the South and the women at the North, all talking about rights, the white men will be in a fix pretty soon.",
  "But what's all this here talking about?",
  "That man over there says that women need to be helped into carriages, and lifted over ditches, and to have the best place everywhere.",
  "Nobody ever helps me into carriages, or over mud-puddles, or gives me any best place!",
  "And ain't I a woman?",
  "Look at me!",
  "Look at my arm!",
  "I have ploughed and planted, and gathered into barns, and no man could head me!",
  "And ain't I a woman?",
  "I could work as much and eat as much as a man—when I could get it—and bear the lash as well!",
  "And ain't I a woman?",
  "I have borne thirteen children, and seen most all sold off to slavery, and when I cried out with my mother's grief, none but Jesus heard me!",
  "And ain't I a woman?",
  "If the first woman God ever made was strong enough to turn the world upside down all alone, these women together ought to be able to turn it back, and get it right side up again!",
  "And now they is asking to do it, the men better let them.",
  "Obliged to you for hearing me, and now old Sojourner ain't got nothing more to say.",
];

// Ordered one-line moves the speaker rebuilds from memory. Copy-swept.
const hint_deck: string[] = [
  "Open with the racket in the room meaning something is out of kilter.",
  "Joke that between Southern slaves and Northern women, the men are in a fix.",
  "Ask what all this talk is really about.",
  "Repeat the man's claim: women need helping into carriages and the best place.",
  "Answer that nobody ever helped you that way.",
  "Land the refrain: and ain't I a woman?",
  "Point to your own body and arm as proof.",
  "You ploughed, planted, and no man could outwork you.",
  "Bring the refrain back again.",
  "You worked, ate, and bore the lash as any man did.",
  "Return to the refrain once more.",
  "You bore thirteen children and watched them sold, heard only by Jesus.",
  "Sound the refrain a final time.",
  "If one woman could turn the world over, these women can turn it back.",
  "The men should step aside and let them.",
  "Close by thanking them, with nothing more to say.",
];

export const aintIAWoman: Speech = {
  id: "aint-i-a-woman",
  title: "Ain't I a Woman?",
  author: "Sojourner Truth",
  year: 1851,
  source_url:
    "https://www.loc.gov/resource/rbcmiller.scrp4006702/?sp=1",
  public_domain_basis:
    "Delivered 1851; the Frances Gage transcription was published 1863, pre-1929 and in the public domain.",
  full_text: sentences.join(" "),
  sentences,
  hint_deck,
};
