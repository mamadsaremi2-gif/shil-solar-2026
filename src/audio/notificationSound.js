import { Howl }
from "howler";

export const notificationSound =
  new Howl({

    src: ["/sounds/notify.mp3"],

    volume: 0.5,

  });
