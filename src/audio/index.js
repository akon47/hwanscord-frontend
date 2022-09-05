function playVoiceChannelConnectionSound() {
  let audio = new Audio(
    "/assets/wood-plank-flicks.mp3"
  );
  audio.play();
}

function playVoiceChannelDisconnectionSound() {
  let audio = new Audio(
    "/assets/metalic-clank.mp3"
  );
  audio.play();
}

export { playVoiceChannelConnectionSound, playVoiceChannelDisconnectionSound };
