# Character roster

What the gallery offers, and what it costs us to draw.

## Three doors into the same room

The gallery is one of three ways in, not the way in. All three produce the same
thing — a `StudioConfig` — so they are interchangeable by construction, and a
character begun at any door can be finished at any other.

| Door | What it is | What it costs us |
|---|---|---|
| **Pick one** | The 57 saved configs below, as a grid of thumbnails. | Nothing new; each entry is a config. |
| **Describe it** | A sentence, read by a keyword parser into a config. | A vocabulary table, `src/describe`. |
| **From a photo** | A photo, read for colouring and features in the tab. | Image analysis, `src/photo`. |

They are presented equal in weight: three plain cards, the open one marked the
way a picked character is, with the key green and a word rather than with size.

**Describe it** is a deterministic phrase table, not a model. It matches the
longest run of words it knows, so "hard hat" beats "hat" and "square glasses"
is not a square face; a colour word takes the colour slot of the nearest phrase
that names one, which is how "a red scarf" and "hair, dark brown" both land
correctly; and a word it does not know is reported back as skipped rather than
guessed at. That last part is the point: the panel can only be honest about a
vocabulary it admits the edges of.

**From a photo** is deliberately the crudest measurement that could work for
each field, because a crude measurement can be explained to the person looking
at the result. Skin tone is the median of the face region.

Finding that region is the whole difficulty, and the first version got it
badly wrong. A real photograph — a man standing in a hotel lobby, warm wood and
beige walls filling the frame — came back with a "face" the size of the whole
picture, a mud-coloured skin tone, a shirt sampled off the wooden floor and a
confident pair of glasses he was not wearing. Skin is a narrow band of chroma,
and so are wood, sand and beige paint: the threshold alone can never carry
this. So a candidate region now has to behave like a face before it is
believed — a plausible share of the frame (between a fiftieth and two fifths),
a face-like aspect, enough density to fill its own box, left-right symmetry
about its own middle, and a band of darker pixels where the eyes and brows sit
that is darker than the cheeks below it. A region that is too large gets one
second look, re-measured around the colour of whatever sits in the middle of
the frame, which is what rescues a close-up taken against a warm wall. If
nothing passes, the answer is `face: null` and a note saying what kind of
photograph would have worked. A brown blob in glasses is a worse outcome than
"I could not read this one".

The shirt is sampled from the band just below the face box, never from the
bottom of the frame, because the bottom of a full-length photograph is the
floor. Glasses are the longest *unbroken* dark run across the eye line rather
than the count of dark pixels in it, since a pair of eyes is two dark patches
with a nose between them and only a frame runs straight across; it would rather
miss real glasses than add imaginary ones. Hair is whatever is left in the band above and beside that
region once the face and the background are removed, with its silhouette
choosing between buzz, bob, long, bun and curly. A beard is "the lower third of
the face is darker than the rest of it". Eye colour is not read at all, and the
panel says so: without landmarks there is nothing to measure, and inventing one
would be worse than leaving it.

What it honestly handles is a head-and-shoulders photograph against a plain
background. A busy or warm-toned room is refused rather than guessed at, and
the panel asks for the kind of photograph that works before anyone drops one in.

The one inference rather than measurement is the ears: what was found is a
human-skin face, so the ears are set to human and the cheek ruff that belongs
to an animal's ears goes with them. It is listed in the readout like everything
else and changed back in one click, which is the test any inference here has to
pass — it has to be visible and reversible, or it does not belong.

Every field carries a confidence, and only a confident field is applied — the
rest stay at whatever the character already had. Each one is also individually
overridable in the readout, because the photo route is a starting point rather
than an answer.

## How the gallery is organised

Four browsable groups, then the studio. Someone arriving with a site to decorate
should find their character by what it *is*, not by a name we made up, so every
entry is a plain noun: Fox, Doctor, Cricketer.

| Group | What it is for | Planned | Built |
|---|---|---|---|
| **Animals** | The headline. Cute creatures, the most popular thing anyone wants. | 26 | 12 |
| **Professions** | Pick your job. The obvious choice for a personal site or portfolio. | 24 | 24 |
| **Sports** | Pick your game. | 12 | 12 |
| **People** | Neutral faces, the starting point for making one that looks like you. | 8 | 8 |
| **Robots and objects** | For products and tools rather than people. | 9 | 1 |

**Build your own** sits alongside them rather than inside them: start from any
character above, from a description, from a photo, or from nothing, and change
the face, colours and accessories. Every gallery entry is just a saved config,
so "use this one" and "make it mine" are the same screen — and so is "describe
one" and "read one off a photo".

### No given names

Earlier drafts called the people Sam, Mei and Zara. Dropped. A visitor browsing
for a mascot gains nothing from a stranger's name, and "Doctor" tells them
instantly what they are looking at. It also sidesteps naming questions
altogether: a common noun belongs to nobody.

---

## Animals (26, 12 built)

**Built:** Fox · Bear · Cat · Bunny · Panda · Red panda · Wolf · Koala ·
Squirrel · Hamster · Otter · Mouse

**Waiting on a new part:** Dog · Hedgehog · Raccoon · Sloth · Tiger ·
Deer · Pig · Owl · Penguin · Chick · Duck · Frog · Sheep · Bee

Of the twelve built, four — koala, hamster, otter and mouse — lean on the bear
ear and read as colour variants of it rather than as themselves. They are the
proof of the costing below: an animal whose whole identity is its ears cannot be
bought with colour.

## Professions (24, all built)

Farmer · Builder · Doctor · Nurse · Engineer · Hacker · Chef · Barista ·
Teacher · Scientist · Mechanic · Firefighter · Pilot · Postal worker ·
Artist · Musician · Gamer · Librarian · Vet · Welder · Gardener ·
Astronaut · Detective · Baker

## Sports (12, all built)

Footballer · Cricketer · Basketballer · Tennis player · Runner · Boxer ·
Swimmer · Cyclist · Skater · Climber · Goalkeeper · Umpire

## People (8, all built)

Eight neutral faces covering a range of skin tones, hair types and features,
each a good starting point for the studio. Listed by look, since they exist to
be changed: Curly · Bun · Buzz · Bob · Ponytail · Beard · Hijab · Headscarf

## Robots and objects (9, 1 built)

**Built:** Robot

**Waiting on a second head architecture:** Clockwork · Drone · Television ·
Radio · Toaster · Rocket · Lantern · Cube

---

## What each group costs

The groups above are how it looks to a visitor. This is the order to build in,
because the parts are the cost and a name is free.

### Built — config only
Fox, Bear, Cat, Bunny, Panda, Red panda, Wolf, Koala, Squirrel, Hamster,
Otter, Mouse, the eight People, and Robot. The rig already has the ears,
muzzle, cheek ruff, eye patch, hair, glasses, facial hair and headwear these
need.

### One new part each, shared by several characters

| New part | Unlocks |
|---|---|
| Beak | Owl · Penguin · Chick · Duck |
| Snout | Dog · Pig |
| Droopy ears | Dog |
| Antlers | Deer |
| Spines | Hedgehog |
| Face mask marking | Raccoon · Sloth |
| Stripe marking | Tiger · Bee |
| Wool crown | Sheep |
| Wide mouth | Frog |

### Two new slots, which carry almost every profession and sport — built

| New slot | Unlocks |
|---|---|
| **Neck accessory**, over the collar | stethoscope · apron · tie · lanyard · scarf · medal |
| **Side accessory**, at ear level | headphones · headset · ear defenders |

Both shipped. The neck accessory lives in the pose-free body layer, so it cannot
disturb the identical torso; the side accessory tracks the head like the ears,
and its one asymmetric piece, the headset boom, is clamped clear of the body band.

New headwear, all shipped: hood, toque, hard hat, straw hat, beret, visor,
headband, grilled helmet, bubble helmet, surgical cap.

A brim turned out to be the interesting one. A flat disc seen head-on projects
to a line, so the first straw hat drew a stick through the character's head. The
near half of the disc is now pushed down and the far half up, by an amount that
fades as the head pitches and the rotation opens the ellipse honestly — the same
cheat the cap brim already used, generalised.

This is why the professions and sports are cheaper than they look. Almost none
of them change the face. A footballer is a shirt colour, a stripe and a
headband, and the rig already has necklines and stripes.

Start with the **hacker**: a hood plus a cool screen glow from below is exactly
the lighting the new shading work added, so it shows the rendering off instead
of fighting it.

### A different head altogether
Television, Radio, Toaster, Rocket, Lantern, Cube, Clockwork, Drone. The head
is a box or a dome with a screen for a face, which means a second head
architecture in the rig. The largest single job here, and worth doing only if
objects earn their place.

---

## Two limits worth stating

**Roles, not people.** A footballer in a red shirt is ours to draw. A particular
living footballer is not: a recognisable likeness carries publicity rights quite
apart from copyright, and club kits are trademarked. So the roster says
"Cricketer" and the shirts get invented colours and no crest.

**Professions are not costumes.** A doctor is a person doing a job, and the
studio lets anyone set skin tone, hair and features. So no profession gets a
fixed face: every one of them ships as a config a visitor can immediately change.

---

## Order of work

1. ~~Finish the human geometry (beard, hair texture, cap brim, eye variety).~~
   Done. The beard was the last of it: it had been lifted so far clear of the
   hair that it read as grey fleece, and now sits a few points above it.
2. ~~Ship the config-only characters.~~ Done — twelve animals, eight people.
3. ~~The neck and side accessory slots, then the new headwear.~~ Done, and they
   did carry the professions and the sports in bulk: all 36 of them are configs.
4. **Next:** the animal parts, best value first: beak, then snout, then markings.
   This is what gets the animal group from twelve to twenty-six, and it is also
   what rescues the four that currently read as recoloured bears.
5. Objects, only if they earn their place.
