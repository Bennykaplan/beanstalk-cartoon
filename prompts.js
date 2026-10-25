// All prompt text lives here so it can be iterated on without touching the server.

export const STYLES = {
  pixar: '3D animated feature-film style (soft global illumination, rounded friendly forms, subsurface-scattered skin, expressive eyes)',
  storybook: 'classic hand-drawn 2D fairy-tale storybook illustration (gouache textures, warm painterly shading)',
  anime: 'clean modern anime / cel-shaded style (crisp line art, flat cel shading, bright highlights)',
  comic: 'bold western comic-book style (inked outlines, halftone shading, punchy contrast)',
  watercolor: "soft watercolor children's-book style (loose washes, visible paper texture, delicate ink lines)",
};

export const EXAGGERATION = {
  1: 'Keep proportions close to real life; stylize only the rendering, not the anatomy.',
  2: 'Use moderate cartoon proportions (slightly larger head and eyes) while keeping every facial feature in its true shape.',
  3: 'Use bold, playful caricature proportions, but exaggerate only what is already distinctive about this face so it stays instantly recognizable.',
};

export const PALETTES = {
  vibrant: 'vibrant, saturated colors',
  pastel: 'soft pastel colors',
  earthy: 'warm earthy, muted colors',
};

export const OUTLINES = {
  none: 'no outlines',
  thin: 'thin, clean outlines',
  bold: 'thick, bold outlines',
};

export const OUTFITS = {
  jack: 'Dress them as Jack from the fairy tale: a simple patched linen tunic, rope belt, brown trousers and worn leather boots.',
  own: 'Keep the clothing from the photo, redrawn in the cartoon style.',
};

export const GLOWUPS = {
  off: 'Do not beautify, slim, age, de-age or add features that are not in the photo.',
  on: 'Glow-up: draw this exact person as the most attractive, heroic version of themselves, like the handsome lead of an animated film: ' +
    'confident charming smile, bright eyes, clear glowing skin, defined jaw and cheekbones, healthy styled hair with exactly the same length, texture and color, ' +
    'fit athletic build and flattering hero lighting. Enhance, never replace: the face, glasses and hair must still be instantly recognizable as them.',
  model: 'Max glow-up: draw this exact person as a strikingly handsome fashion-model version of themselves, magazine-cover attractive: ' +
    'a broad, square face with a wide, strong, squared-off jawline and square chin (not narrow, oval or pointed), ' +
    'chiseled cheekbones, smoldering confident expression with a slight smirk, flawless glowing skin, ' +
    'well-groomed hair with exactly the same length, texture (straight stays straight, curly stays curly) and color, ' +
    'broad shoulders and a lean muscular build, glamorous rim lighting. Enhance, never replace: eye shape, nose, ' +
    'skin tone, hair, facial hair and any glasses must stay as in the photo so they are instantly recognizable.',
};

// The caption on each generated image is exactly the `spec` string below.
export const SCENES = {
  planting: {
    title: 'Jack is planting the seeds',
    spec:
      'Jack is planting the seeds. Jack kneels in a small dirt garden patch beside his family\'s thatched-roof cottage at sunrise. ' +
      'With one hand he presses a glowing green magic bean into a freshly dug hole in the dark soil; ' +
      'his other hand holds a few more beans. A small cloth pouch and a wooden trowel lie beside him.',
  },
  climbing: {
    title: 'Jack is climbing the beanstalk',
    spec:
      'Jack is climbing the beanstalk. Jack climbs a single enormous, twisting green beanstalk high above the clouds, ' +
      'gripping the stalk with both hands. Far below him, through a gap in the clouds, his tiny cottage and fields are visible. ' +
      "A giant's castle sits on the clouds above him.",
  },
};

const IDENTITY_RULES =
  'Identity is the top priority: the face must be recognizably the same person. Preserve exactly: face shape, ' +
  'face width and cheek fullness (do not narrow or lengthen the face), jawline and chin, ' +
  'eye shape, eye spacing and eye color, eyebrow shape, nose shape and size, mouth and lip shape, ears, ' +
  'hairline, hairstyle, hair length, hair color and texture, skin tone, facial hair or lack of it, freckles, moles, ' +
  'apparent age and gender (an adult keeps adult facial proportions and never looks like a child or teenager). Keep eyebrow thickness and darkness as in the photo. ' +
  'If the person wears glasses, copy the exact frame shape, thickness, material and color ' +
  '(clear plastic frames stay clear and thick, not thin wire).';

export function styleLine(s) {
  return `Art style: ${STYLES[s.style]}, ${PALETTES[s.palette]}, ${OUTLINES[s.outline]}. ${EXAGGERATION[s.exaggeration]} ${GLOWUPS[s.glowup]}`;
}

export function cartoonifyPrompt(s) {
  return [
    'Turn the person in this photo into a cartoon character.',
    styleLine(s),
    IDENTITY_RULES,
    OUTFITS[s.outfit],
    'Show the character from the head down to the knees, so the face is large and detailed, ' +
      'standing in a relaxed neutral pose, facing the viewer almost straight on (as in the photo), ' +
      'on a plain off-white background. Keep the body build implied by the photo. ' +
      'Exactly one person. No text, no captions, no watermark.',
  ].join('\n\n');
}

export function scenePrompt(s, sceneKey) {
  const scene = SCENES[sceneKey];
  return [
    'Image 1 is a cartoon character sheet. Image 2 is the real photo of the same person. ' +
      'Create a new illustration in which this exact character plays the role of Jack in "Jack and the Beanstalk".',
    `Scene (depict every element literally): ${scene.spec}`,
    'Jack is the character from Image 1, with the face of the person in Image 2. ' + IDENTITY_RULES,
    'Keep the character\'s outfit and art style from Image 1. ' + styleLine(s),
    'Composition: the camera is close to Jack. Frame him from about the waist up, so his head takes up ' +
      'at least one quarter of the image height; the setting stays clearly visible around and behind him. ' +
      'Jack is the only person. His face is fully visible (three-quarter view toward the viewer, not hidden by hands, leaves or shadow) ' +
      'and large enough to recognize. Every element named in the scene must be clearly visible. ' +
      'No text, no captions, no watermark.',
  ].join('\n\n');
}
