/**
 * This is a buffer source tied to a gain node.
 *
 * This Track is designed to be constantly playing,
 * but have its volume (gain) turned on and off when
 * "played" and "paused".
 */
class Track {
  public isPlaying: boolean = false;
  private source: AudioBufferSourceNode;
  public outputNode: GainNode;

  constructor(trackBuffer: AudioBuffer, audioContext: AudioContext) {
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = 0;

    this.source = audioContext.createBufferSource();
    this.source.buffer = trackBuffer;
    this.source.connect(this.outputNode);
    this.source.loop = true;

    this.outputNode.connect(audioContext.destination);
  }

  /**
   * This should only ever be called once inside of the Tracker
   * itself. Consumers of Track should not use this function.
   *
   * I should rework the API to not expose this on the public
   * facing API, but I will not for now.
   */
  _start() {
    this.source.start();
  }

  play() {
    this.outputNode.gain.value = 1;
    this.isPlaying = true;
  }

  stop() {
    this.outputNode.gain.value = 0;
    this.isPlaying = false;
  }
}

class Tracker {
  private audioContext: AudioContext = new AudioContext();
  private trackUrls = {
    metronome1: new URL("./metronome1.mp3", import.meta.url),
    metronome2: new URL("./metronome2.mp3", import.meta.url),
    zoldath2: new URL("./Zoldath 2 2024-11-02 2035.mp3", import.meta.url),
  };
  public tracks: Record<string, Track> = {};
  public isLoaded = false;

  constructor() {
    this.load();
  }

  async load() {
    const loadPromises = Object.entries(this.trackUrls).map(
      async ([key, url]) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const trackBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        const track = new Track(trackBuffer, this.audioContext);

        this.tracks[key] = track;
      }
    );

    await Promise.all(loadPromises);

    Object.values(this.tracks).forEach((track) => track._start());

    this.isLoaded = true;
  }
}

export default new Tracker();
