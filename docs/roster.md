# Character roster

The plan for what Mascotry ships in its gallery. Grouped by how much new drawing
code each character needs, because that, not the naming, is the real work.

Today the rig knows: four face shapes; ears in human, cat, bear, fox, bunny and
bolt; a muzzle; cheek ruff and fluff; an oval eye patch; seven hair styles;
round and square glasses; stubble, moustache and beard; cap, beanie, antenna and
hijab; six necklines; stripe and badge shirt details; and the eye, lash, lid and
brow sets.

## Naming

Animals and objects take the common noun. People take a given name, which reads
warmer than labelling someone "Beard" or "Glasses" and keeps the roster ours.

Two names are off the table whatever else we build. **Kamran** is another
author's own name and self-portrait. **Gearbot** and **Postbot** are his
coinages rather than ordinary words. Everything else on this list is a plain
noun that nobody owns.

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
4. Wave 3 headwear.
5. Wave 4 only if objects earn their place.
