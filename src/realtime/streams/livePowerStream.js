import { interval } from "rxjs";
import { map } from "rxjs/operators";

export const livePowerStream = interval(2000).pipe(

  map(() => {

    return {

      pvPower:
        Math.floor(
          4000 + Math.random() * 4000
        ),

      batterySOC:
        Math.floor(
          70 + Math.random() * 30
        ),

      loadPower:
        Math.floor(
          1500 + Math.random() * 2500
        ),

      grid:
        Math.random() > 0.5
          ? "ONLINE"
          : "OFFLINE",

      timestamp:
        Date.now(),

    };

  })

);
