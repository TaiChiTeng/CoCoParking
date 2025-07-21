//GameAudio.ts
import { _decorator, Node, AudioSource, AudioClip, resources, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameAudioClip')
export class GameAudioClip {
    @property(AudioClip)
    clip: AudioClip = null;

    @property
    volume: number = 1.0;
}

/**
 * @en
 * this is a sington class for audio play, can be easily called from anywhere in you project.
 * @zh
 * 这是一个用于播放音频的单件类，可以很方便地在项目的任何地方调用。
 */ 
export class GameAudio {
    private static _inst: GameAudio;
    public static get inst(): GameAudio {
        if (this._inst == null) {
            this._inst = new GameAudio();
        }
        return this._inst;
    }

    private _audioSource: AudioSource;
    constructor() {
        //@en create a node as GameAudio
        //@zh 创建一个节点作为 GameAudio
        let GameAudio = new Node();
        GameAudio.name = '__GameAudio__';

        //@en add to the scene.
        //@zh 添加节点到场景
        director.getScene().addChild(GameAudio);

        //@en make it as a persistent node, so it won't be destroied when scene change.
        //@zh 标记为常驻节点，这样场景切换的时候就不会被销毁了
        director.addPersistRootNode(GameAudio);

        //@en add AudioSource componrnt to play audios.
        //@zh 添加 AudioSource 组件，用于播放音频。
        this._audioSource = GameAudio.addComponent(AudioSource);
    }

    public get audioSource() {
        return this._audioSource;
    }
    
    playOneShot(audioClip: GameAudioClip, volume: number = 1.0) {
        this.playOneShotRaw(audioClip.clip, audioClip.volume * volume);
    }

    /**
     * @en
     * play short audio, such as strikes,explosions
     * @zh
     * 播放短音频,比如 打击音效，爆炸音效等
     * @param sound clip or url for the audio
     * @param volume 
     */
    playOneShotRaw(sound: AudioClip | string, volume: number = 1.0) {
        if (sound instanceof AudioClip) {
            this._audioSource.playOneShot(sound, volume);
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.playOneShot(clip, volume);
                }
            });
        }
    }

    /**
     * @en
     * play long audio, such as the bg music
     * @zh
     * 播放长音频，比如 背景音乐
     * @param sound clip or url for the sound
     * @param volume 
     */
    play(sound: AudioClip | string, volume: number = 1.0) {
        if (sound instanceof AudioClip) {
            this._audioSource.stop();
            this._audioSource.clip = sound;
            this._audioSource.play();
            this.audioSource.volume = volume;
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.stop();
                    this._audioSource.clip = clip;
                    this._audioSource.play();
                    this.audioSource.volume = volume;
                }
            });
        }
    }

    setVolume(volume: number = 1.0) {
        this.audioSource.volume = volume;
    }

    /**
     * stop the audio play
     */
    stop() {
        this._audioSource.stop();
    }

    /**
     * pause the audio play
     */
    pause() {
        this._audioSource.pause();
    }

    /**
     * resume the audio play
     */
    resume(){
        this._audioSource.play();
    }
}