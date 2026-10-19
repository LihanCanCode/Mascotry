# Character roster

The plan for what Mascotry ships in its gallery. Ninety-six characters. Grouped by how much new drawing
code each character needs, because that, not the naming, is the real work.

Today the rig knows: four face shapes; ears in human, cat, bear, fox, bunny and
bolt; a muzzle; cheek ruff and fluff; an oval eye patch; seven hair styles;
round and square glasses; stubble, moustache and beard; cap, beanie, antenna and
hijab; six necklines; stripe and badge shirt details; and the eye, lash, lid and
brow sets.

## Naming

Animals and objects take the common noun. People take a given name, which reads
warmer than labelling someone "Beard" or "Glasses" and keeps the roster ours.

Two kinds of name are off the table whatever else we build: anyone else's own
name or self-portrait, and anyone else's coined character names. Every name on
this list is either a plain noun that nobody owns or an ordinary given name
chosen here.

---

## Wave 1 — the rig draws these today (28)

No new parts. A config each, then tuning.

### Animals (12)
Fox · Bear · Cat · Bunny · Panda · Wolf · Koala · Red panda ·
Squirrel · Hamster · Otter · Mouse

Panda is bear ears plus the eye patch. Red panda is fox ears plus ruff plus
patch. Koala is bear ears plus fluff. Squirrel is fox ears plus a big ruff.

### People (15)
Sam · Mei · Zara · Amina · Leo · Jonas · Noor · Otto ·
Priya · Tomas · Ines · Kofi · Hana · Dmitri · Yusuf

The first eight exist. The rest are new combinations of hair, glasses, facial
hair, headwear, skin tone and neckline that the rig already supports.

### Robots (1)
Pip — bolt ears and an antenna.

---

## Wave 2 — one new part each (17)

Each needs a single new drawing module, and each module then serves several
characters. Ordered by how much each one buys us.

| New part | Unlocks |
|---|---|
| Beak | Owl · Penguin · Chick · Duck |
| Snout | Dog · Pug · Pig · Dino |
| Droopy ears | Dog · Pug · Rabbit lop |
| Antlers / horns | Deer · Goat |
| Spines | Hedgehog · Porcupine |
| Face mask marking | Raccoon · Sloth · Badger |
| Stripe marking | Tiger · Zebra · Bee |
| Wool crown | Sheep · Lamb |

Characters: Owl · Penguin · Chick · Duck · Dog · Pug · Pig · Dino ·
Deer · Goat · Hedgehog · Raccoon · Sloth · Badger · Tiger · Bee · Sheep

---

## Wave 3 — new headwear, same head (9)

Hats and helmets that sit on the existing head. Cheaper than Wave 2 because
nothing about the face changes.

Chef (toque) · Nurse (cap) · Builder (hard hat) · Scientist (goggles) ·
Pirate (bandana and eye patch) · Wizard (pointed hat, with the beard we have) ·
Knight (visored helm) · Astronaut (bubble helmet) · Ranger (brimmed hat)

---

## Wave 3b — jobs and sports (34)

Far cheaper than they look. Almost none of these change the face: they are a
hat, something at the neck, a shirt colour and a shirt detail. The rig already
has necklines and a stripe detail, so a football shirt is mostly configuration.

Two new part slots unlock nearly the whole group:

| New slot | Unlocks |
|---|---|
| **Neck accessory** (sits over the collar) | stethoscope · apron strap · tie · lanyard · scarf · medal |
| **Side accessory** (at ear level) | headphones · headset · ear defenders · earrings |

Plus a handful of new headwear: hood, toque, hard hat, straw hat, beret,
visor, headband, grilled helmet, bubble helmet, surgical cap.

### Jobs (22)
Farmer (straw hat, dungarees) · Builder (hard hat, hi-vis stripe) ·
Doctor (scrubs, stethoscope) · Nurse (cap) · Engineer (goggles, badge) ·
Hacker (hood, glasses, screen glow) · Chef (toque) · Barista (cap, apron) ·
Teacher (glasses, collar) · Scientist (goggles, lab collar) ·
Mechanic (cap, overalls) · Firefighter (helmet) · Pilot (cap, aviators) ·
Postal worker (cap, satchel strap) · Artist (beret) ·
Musician (headphones) · Gamer (headset) · Librarian (glasses, cardigan) ·
Vet (scrubs, stethoscope) · Chemist (goggles) · Welder (visor) ·
Gardener (straw hat, gloves)

The **hacker** is the one to build first. A hood plus a cool screen glow from
below is exactly the lighting the new rim-light work is adding, so it shows the
shading off rather than fighting it.

### Sports (12)
Footballer (shirt stripe, headband) · Cricketer (grilled helmet, whites) ·
Basketballer (vest, headband) · Tennis player (visor, wristband) ·
Runner (vest, number) · Boxer (headguard) · Swimmer (cap, goggles) ·
Cyclist (helmet, sunglasses) · Skater (beanie) · Climber (helmet) ·
Goalkeeper (gloves, long sleeves) · Umpire (hat, badge)

### A limit worth stating plainly

These are **roles, not people**. A footballer in a red shirt is ours to draw.
A particular living footballer is not: a recognisable likeness of a real person
carries personality and publicity rights quite apart from copyright, and club
and national kits are trademarked. So the roster has "Cricketer", never a named
player, and shirts get invented colours and no crest.

---

## Wave 4 — a different head altogether (8)

These are not faces with parts bolted on; the head itself is a box, a dome or a
cylinder with a screen for a face. That means a second head architecture in the
rig, which is the largest single piece of work on this page.

Television · Radio · Toaster · Rocket · Lantern · Cube · Clockwork · Drone

---

## The honest problem

The reference gallery looks better than ours, and the gap is not the roster. Its
characters were drawn by an image model: soft gradients, fur texture, painted
shadow, little asymmetries. Ours are flat vector shapes with two or three tones.
Adding forty more flat characters gives us forty more flat characters.

Three ways to close it, and they are not exclusive:

1. **Enrich the rig.** Add a soft shading pass, a fur or texture edge, a warmer
   outline that varies in weight, and a rim light. Every character gains at
   once, it stays parametric, and it stays ours. This is the one worth doing
   first, and it should land before Wave 2, so new characters are born at the
   better quality rather than needing a second pass.
2. **Hand-tune each character.** Per-character tweaks on top of the rig. Slow,
   and it fights the point of a parametric system.
3. **Generate the art.** Better texture immediately, but it is no longer
   parametric, the user cannot recolour it, and the copyright position of model
   output is unsettled. Worth testing as a separate style, not as the default.

## Suggested order

1. Enrich the rig (shading, texture, outline weight).
2. Wave 1, so the gallery has 28 characters at the new quality.
3. Wave 2 parts, best value first: beak, then snout, then markings.
4. Wave 3 headwear, then Wave 3b, starting with the neck and side accessory
   slots since those two unlock the most.
5. Wave 4 only if objects earn their place.
