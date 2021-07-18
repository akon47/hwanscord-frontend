function playVoiceChannelConnectionSound() {
  let audio = new Audio(
    "https://kimhwan.kr/assets/Wood_Plank_Flicks.mp3"
  );
  audio.play();
}

function playVoiceChannelDisconnectionSound() {
  let audio = new Audio(
    "https://kimhwan.kr/assets/Metallic_Clank.mp3"
  );
  audio.play();
}

export { playVoiceChannelConnectionSound, playVoiceChannelDisconnectionSound };
