import type { Speech } from "../types";

// The ten sentences of the Bliss copy, verbatim. Sentences 6 and 10 keep
// Lincoln's em-dashes: this is a historical quotation, exempt from the copy
// sweep, and must not be "corrected".
const sentences: string[] = [
  "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.",
  "Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.",
  "We are met on a great battle-field of that war.",
  "We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.",
  "It is altogether fitting and proper that we should do this.",
  "But, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground.",
  "The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract.",
  "The world will little note, nor long remember what we say here, but it can never forget what they did here.",
  "It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced.",
  "It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth.",
];

// One one-line hint per sentence, already copy-swept.
const hint_deck: string[] = [
  "Set the clock back 87 years and name the new nation and its founding idea.",
  "Now a civil war tests whether such a nation can last.",
  "We stand on that battlefield.",
  "We came to dedicate ground for those who died here.",
  "Doing this is right and proper.",
  "In a larger sense we cannot make this ground sacred.",
  "The men who fought here already made it sacred, beyond our words.",
  "The world will forget our words but not their deeds.",
  "The task falls to us, the living, to finish their work.",
  "We resolve these dead did not die in vain, and that government by the people endures.",
];

export const gettysburg: Speech = {
  id: "gettysburg",
  title: "The Gettysburg Address",
  author: "Abraham Lincoln",
  year: 1863,
  source_url: "https://www.loc.gov/resource/rbpe.24404500/",
  public_domain_basis:
    "Delivered 1863; published pre-1929 and a work of US history in the public domain.",
  full_text: sentences.join(" "),
  sentences,
  hint_deck,
};
