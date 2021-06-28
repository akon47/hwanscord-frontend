function playVoiceChannelConnectionSound() {
  let audio = new Audio(
    "https://discord.com/assets/5dd43c946894005258d85770f0d10cff.mp3"
  );
  audio.play();
}

function playVoiceChannelDisconnectionSound() {
  let audio = new Audio(
    "https://discord.com/assets/7e125dc075ec6e5ae796e4c3ab83abb3.mp3"
  );
  audio.play();
}

export { playVoiceChannelConnectionSound, playVoiceChannelDisconnectionSound };
