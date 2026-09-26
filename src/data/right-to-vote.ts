import type { Speech } from "../types";

// Susan B. Anthony's address after her 1872 arrest for voting, delivered
// throughout 1873. Verbatim historical quotation, including the em-dashes she
// used, which are exempt from the copy sweep.
const sentences: string[] = [
  "Friends and fellow citizens: I stand before you tonight under indictment for the alleged crime of having voted at the last presidential election, without having a lawful right to vote.",
  "It shall be my work this evening to prove to you that in thus voting, I not only committed no crime, but, instead, simply exercised my citizen's rights, guaranteed to me and all United States citizens by the National Constitution, beyond the power of any state to deny.",
  "The preamble of the Federal Constitution says: “We, the people of the United States, in order to form a more perfect union, establish justice, insure domestic tranquility, provide for the common defense, promote the general welfare, and secure the blessings of liberty to ourselves and our posterity, do ordain and establish this Constitution for the United States of America.”",
  "It was we, the people; not we, the white male citizens; nor yet we, the male citizens; but we, the whole people, who formed the Union.",
  "And we formed it, not to give the blessings of liberty, but to secure them; not to the half of ourselves and the half of our posterity, but to the whole people—women as well as men.",
  "And it is a downright mockery to talk to women of their enjoyment of the blessings of liberty while they are denied the use of the only means of securing them provided by this democratic-republican government—the ballot.",
  "The only question left to be settled now is: Are women persons?",
  "And I hardly believe any of our opponents will have the hardihood to say they are not.",
  "Being persons, then, women are citizens; and no state has a right to make any law, or to enforce any old law, that shall abridge their privileges or immunities.",
  "Hence, every discrimination against women in the constitutions and laws of the several states is today null and void, precisely as is every one against Negroes.",
];

// Ordered one-line moves the speaker rebuilds from memory. Copy-swept.
const hint_deck: string[] = [
  "Open: you stand indicted for voting without a lawful right.",
  "State your task tonight: prove that voting was your right, not a crime.",
  "Quote the preamble that begins with We, the people.",
  "Stress it was the whole people, not only white men, who formed the Union.",
  "The Union was formed to secure liberty for the whole people, women included.",
  "Call it a mockery to deny women the ballot, the only means to secure liberty.",
  "Pose the one open question: are women persons?",
  "No opponent dares answer that women are not persons.",
  "Since women are persons, they are citizens no state may abridge.",
  "Close: every law discriminating against women is null and void.",
];

export const rightToVote: Speech = {
  id: "right-to-vote",
  title: "On Women's Right to Vote",
  author: "Susan B. Anthony",
  year: 1873,
  source_url:
    "https://www.loc.gov/exhibitions/women-fight-for-the-vote/about-this-exhibition/seneca-falls-and-building-a-movement-1776-1890/the-womans-hour/susan-b-anthony-arrested/",
  public_domain_basis:
    "Delivered 1873; published pre-1929 and in the public domain.",
  full_text: sentences.join(" "),
  sentences,
  hint_deck,
};
