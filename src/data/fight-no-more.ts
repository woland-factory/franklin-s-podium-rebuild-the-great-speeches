import type { Speech } from "../types";

// Chief Joseph's surrender speech, recorded by Lieutenant Charles Erskine
// Scott Wood, October 1877. Verbatim historical quotation: the em-dash in
// sentence 10 is Joseph's as published, exempt from the copy sweep.
const sentences: string[] = [
  "Tell General Howard I know his heart.",
  "What he told me before, I have it in my heart.",
  "I am tired of fighting.",
  "Our chiefs are killed; Looking Glass is dead, Toohoolhoolzote is dead.",
  "The old men are all dead.",
  "It is the young men who say yes or no.",
  "He who led on the young men is dead.",
  "It is cold, and we have no blankets; the little children are freezing to death.",
  "My people, some of them, have run away to the hills, and have no blankets, no food.",
  "No one knows where they are—perhaps freezing to death.",
  "I want to have time to look for my children, and see how many of them I can find.",
  "Maybe I shall find them among the dead.",
  "Hear me, my chiefs!",
  "I am tired; my heart is sick and sad.",
  "From where the sun now stands I will fight no more forever.",
];

// Ordered one-line moves the speaker rebuilds from memory. Copy-swept.
const hint_deck: string[] = [
  "Open by telling Howard you know his heart.",
  "Say the words he gave you still live in your heart.",
  "Admit plainly that you are tired of fighting.",
  "Name the chiefs who have been killed.",
  "The old men who guided the people are gone.",
  "Now only the young men decide yes or no.",
  "The one who led the young men is dead too.",
  "In the cold, with no blankets, the children are dying.",
  "Some of your people fled to the hills with nothing.",
  "No one knows where they are.",
  "Ask for time to search for your scattered children.",
  "Fear that you may find them among the dead.",
  "Call your chiefs to hear you.",
  "Say your heart is sick and sad.",
  "Close: from where the sun now stands, fight no more forever.",
];

export const fightNoMore: Speech = {
  id: "fight-no-more",
  title: "I Will Fight No More Forever",
  author: "Chief Joseph",
  year: 1877,
  source_url:
    "https://www.americanyawp.com/reader/reconstruction/chief-joseph-on-indian-affairs-1877-1879/",
  public_domain_basis:
    "Surrender speech delivered 1877; the transcription was published pre-1929 and is in the public domain.",
  full_text: sentences.join(" "),
  sentences,
  hint_deck,
};
