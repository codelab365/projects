/* Quelle: Wikipedia "Deutscher Spielepreis" (en) und "Österreichischer
   Spielepreis" (de), Stand September 2026. Es sind jeweils die Erstplatzierten
   (Hauptpreis / Platz 1) je Jahrgang erfasst. */

const SP_CATEGORIES = [
  { key: 'dsp', label: 'Deutscher Spielepreis', badgeClass: 'badge-dsp' },
  { key: 'at', label: 'Österreichischer Spielepreis', badgeClass: 'badge-at' }
];

function s(id, title, year, cat, designer, publisher, bggQuery) {
  const c = SP_CATEGORIES.find(x => x.key === cat);
  return { id, title, year, catKey: cat, catLabel: c.label, catBadgeClass: c.badgeClass, designer, publisher, bggQuery };
}

const SP_GAMES = [
  // ---------- Deutscher Spielepreis (Platz 1) 1990–2025 ----------
  s('dsp-1990', 'Adel Verpflichtet', 1990, 'dsp', 'Klaus Teuber', 'F.X. Schmid', 'Hoity Toity Adel Verpflichtet'),
  s('dsp-1991', 'Das Labyrinth der Meister', 1991, 'dsp', 'Max J. Kobbert', 'Ravensburger', 'Master Labyrinth'),
  s('dsp-1992', 'Der Fliegende Holländer', 1992, 'dsp', '', '', 'Flying Dutchman board game'),
  s('dsp-1993', 'Modern Art', 1993, 'dsp', 'Reiner Knizia', 'Hans im Glück'),
  s('dsp-1994', '6 nimmt!', 1994, 'dsp', 'Wolfgang Kramer', 'Amigo'),
  s('dsp-1995', 'Die Siedler von Catan', 1995, 'dsp', 'Klaus Teuber', 'Kosmos'),
  s('dsp-1996', 'El Grande', 1996, 'dsp', 'Wolfgang Kramer, Richard Ulrich', 'Hans im Glück'),
  s('dsp-1997', 'Löwenherz', 1997, 'dsp', 'Klaus Teuber', 'Goldsieber'),
  s('dsp-1998', 'Euphrat und Tigris', 1998, 'dsp', 'Reiner Knizia', 'Hans im Glück', 'Tigris and Euphrates'),
  s('dsp-1999', 'Tikal', 1999, 'dsp', 'Wolfgang Kramer, Michael Kiesling', 'Ravensburger'),
  s('dsp-2000', 'Tadsch Mahal', 2000, 'dsp', 'Reiner Knizia', 'Alea', 'Taj Mahal board game'),
  s('dsp-2001', 'Carcassonne', 2001, 'dsp', 'Klaus-Jürgen Wrede', 'Hans im Glück'),
  s('dsp-2002', 'Puerto Rico', 2002, 'dsp', 'Andreas Seyfarth', 'Alea'),
  s('dsp-2003', 'Amun-Re', 2003, 'dsp', 'Reiner Knizia', 'Hans im Glück'),
  s('dsp-2004', 'Sankt Petersburg', 2004, 'dsp', 'Michael Tummelhofer', 'Hans im Glück', 'Saint Petersburg board game'),
  s('dsp-2005', 'Louis XIV', 2005, 'dsp', 'Rüdiger Dorn', 'alea'),
  s('dsp-2006', 'Caylus', 2006, 'dsp', 'William Attia', 'Ystari/Huch & Friends'),
  s('dsp-2007', 'Die Säulen der Erde', 2007, 'dsp', 'Michael Rieneck, Stefan Stadler', 'Kosmos', 'The Pillars of the Earth board game'),
  s('dsp-2008', 'Agricola', 2008, 'dsp', 'Uwe Rosenberg', 'Lookout Games'),
  s('dsp-2009', 'Dominion', 2009, 'dsp', 'Donald X. Vaccarino', 'Hans im Glück'),
  s('dsp-2010', 'Fresco', 2010, 'dsp', 'Marco Ruskowski, Marcel Süßelbeck', 'Queen Games'),
  s('dsp-2011', '7 Wonders', 2011, 'dsp', 'Antoine Bauza', 'Repos Production'),
  s('dsp-2012', 'Village', 2012, 'dsp', 'Inka Brand, Markus Brand', 'eggertspiele/Pegasus'),
  s('dsp-2013', 'Terra Mystica', 2013, 'dsp', 'Jens Drögemüller, Helge Ostertag', 'Feuerland Spiele'),
  s('dsp-2014', 'Russian Railroads', 2014, 'dsp', 'Helmut Ohley, Leonhard Orgler', 'eggertspiele'),
  s('dsp-2015', 'Auf den Spuren von Marco Polo', 2015, 'dsp', 'Simone Luciani, Daniele Tascini', 'Hans im Glück', 'The Voyages of Marco Polo'),
  s('dsp-2016', 'Mombasa', 2016, 'dsp', 'Alexander Pfister', 'eggertspiele'),
  s('dsp-2017', 'Terraforming Mars', 2017, 'dsp', 'Jacob Fryxelius', 'Schwerkraft-Verlag'),
  s('dsp-2018', 'Azul', 2018, 'dsp', 'Michael Kiesling', 'Next Move Games'),
  s('dsp-2019', 'Flügelschlag', 2019, 'dsp', 'Elizabeth Hargrave', 'Feuerland Spiele', 'Wingspan'),
  s('dsp-2020', 'Die Crew', 2020, 'dsp', 'Thomas Sing', 'Kosmos', 'The Crew Quest for Planet Nine'),
  s('dsp-2021', 'Die verlorenen Ruinen von Arnak', 2021, 'dsp', 'Min\u00e1ri, Michal Štach', 'Frosted Games', 'Lost Ruins of Arnak'),
  s('dsp-2022', 'Ark Nova', 2022, 'dsp', 'Mathias Wigge', 'Feuerland Spiele'),
  s('dsp-2023', 'Planet Unknown', 2023, 'dsp', 'Ryan Lambert, Adam Rehberg', 'Corax Games'),
  s('dsp-2024', 'Forest Shuffle', 2024, 'dsp', 'Tim Rogasch, Sarah Kirchner', 'Skellig Games'),
  s('dsp-2025', 'SETI: Search for Extraterrestrial Intelligence', 2025, 'dsp', 'Pierrick Yakovenko', 'Board&Dice'),

  // ---------- Österreichischer Spielepreis – Spiel der Spiele 2001–2025 ----------
  s('at-2001', 'Die neuen Entdecker', 2001, 'at', 'Klaus Teuber', 'Kosmos', 'Entdecker Exploring New Horizons'),
  s('at-2002', 'Pueblo', 2002, 'at', 'Michael Kiesling, Wolfgang Kramer', 'Ravensburger'),
  s('at-2003', 'King Arthur', 2003, 'at', 'Reiner Knizia', 'Ravensburger'),
  s('at-2004', 'Einfach Genial', 2004, 'at', 'Reiner Knizia', 'Kosmos', 'Ingenious board game'),
  s('at-2005', 'Trans Europa', 2005, 'at', 'Franz-Benno Delonge', 'Winning Moves'),
  s('at-2006', 'Tal der Abenteuer', 2006, 'at', 'Reiner Knizia', 'Parker/Hasbro'),
  s('at-2007', 'Extreme Activity', 2007, 'at', 'Ulrike Catty, Maria Führer', 'Piatnik'),
  s('at-2008', 'Suleika', 2008, 'at', 'Dominique Ehrhard', 'Zoch'),
  s('at-2009', 'Ramses Pyramid', 2009, 'at', 'Reiner Knizia', 'Lego'),
  s('at-2010', 'Atlantis', 2010, 'at', 'Leo Colovini', 'Amigo'),
  s('at-2011', 'Asara', 2011, 'at', 'Wolfgang Kramer, Michael Kiesling', 'Ravensburger'),
  s('at-2012', 'Santa Cruz', 2012, 'at', 'Marcel-André Casasola Merkle', 'Hans im Glück'),
  s('at-2013', 'Golden Horn: Von Venedig nach Konstantinopel', 2013, 'at', 'Leo Colovini', 'Piatnik'),
  s('at-2014', 'Abluxxen', 2014, 'at', 'Wolfgang Kramer, Michael Kiesling', 'Ravensburger'),
  s('at-2015', 'Mmm!', 2015, 'at', 'Reiner Knizia', 'Pegasus Spiele'),
  s('at-2016', 'Kerala: Der Weg der Elefanten', 2016, 'at', 'Kirsten Hiese', 'Kosmos'),
  s('at-2017', 'Bärenpark', 2017, 'at', 'Phil Walker-Harding', 'Lookout Games'),
  s('at-2018', 'Istanbul – Das Würfelspiel', 2018, 'at', 'Rüdiger Dorn', 'Pegasus Spiele', 'Istanbul The Dice Game'),
  s('at-2019', 'Forbidden Sky', 2019, 'at', 'Matt Leacock', 'Schmidt Spiele'),
  s('at-2020', 'Smart 10', 2020, 'at', 'Christoph Reiser, Arno Steinwender', 'Piatnik'),
  s('at-2021', 'Flyin\u2019 Goblin', 2021, 'at', 'Corentin Lebrat, Théo Rivière', 'iello'),
  s('at-2022', 'Wonder Book', 2022, 'at', 'Martino Chiacchiera, Michele Piccolini', 'da Vinci/abacusspiele'),
  s('at-2023', 'Café del Gatto', 2023, 'at', 'Lena Burkhardt, Julia Wagner', 'Schmidt Spiele'),
  s('at-2024', 'Mycelia', 2024, 'at', 'Daniel Greiner', 'Ravensburger'),
  s('at-2025', 'Gloomies', 2025, 'at', 'Filippo Landini', 'Ravensburger')
];
