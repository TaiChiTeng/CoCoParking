import { _decorator, AudioClip, AudioSource, Component, sys } from 'cc';

import { AudioMgr } from './AudioMgr';
const { ccclass, property } = _decorator;

@ccclass("CarSound")
export class CarSound {
    @property(AudioClip)
    clip : AudioClip = null;
}

@ccclass("CarMusic")
export class CarMusic {
    @property(AudioClip)
    clip : AudioClip = null;
}


@ccclass('CarAudio')
export class CarAudio extends Component {

    @property([CarMusic])
    bgMusics : CarMusic[] = [];

    @property([CarSound])
    carSounds : CarSound[] = [];

    STORE_VERSION = 0;
    AUDIO_STORE_KEY = "audio"
    audioConfig = {version:0, isAudioOn: true}

    currMusic: CarMusic = null;
    currSound: CarSound = null;

    musicAudioSource: AudioSource = null;

    resumeMusic(force: boolean) {
        if (!this.audioConfig.isAudioOn) {
            return;
        }
        if (force) {
            let time = this.musicAudioSource.currentTime;
            this.musicAudioSource.play();
            this.musicAudioSource.currentTime = time;
        }
        else if (!this.musicAudioSource.playing) {
            this.musicAudioSource.play();
        }
    }

    loopMusic() {
        let music = this.bgMusics[Math.floor(Math.random() * this.bgMusics.length)];
        this.musicAudioSource.clip = music.clip;
        this.musicAudioSource.volume = this.audioConfig.isAudioOn ? 1.0 : 0.0;
        this.musicAudioSource.play();
        this.currMusic = music;
        this.scheduleOnce(()=>{
            this.loopMusic();
        }, music.clip.getDuration())
    }

    playCarSound() {
        if (!this.audioConfig.isAudioOn) {
            return;
        }
        let sound = this.carSounds[Math.floor(Math.random() * this.carSounds.length)];
        AudioMgr.inst.playOneShot(sound.clip, 1.0);
    }

    loadConfig() {
        let saveConfig = sys.localStorage.getItem(this.AUDIO_STORE_KEY);
        if (saveConfig) {
            try {
                let loadedConfig = JSON.parse(saveConfig);
                if (loadedConfig.version == this.STORE_VERSION) {
                    this.audioConfig = loadedConfig;
                }
            }
            catch(e) {
                console.log("音频配置使用默认值", e);
            }
        }
    }

    saveConfig() {
        let saveConfig = JSON.stringify(this.audioConfig);
        sys.localStorage.setItem(this.AUDIO_STORE_KEY, saveConfig);
    }

    onClickAudio() {
        this.audioConfig.isAudioOn = !this.audioConfig.isAudioOn;
        this.saveConfig();
        
        // 立即应用音频开关状态到当前播放的背景音乐
        if (this.musicAudioSource) {
            this.musicAudioSource.volume = this.audioConfig.isAudioOn ? 1.0 : 0.0;
        }
    }

    start() {
        this.musicAudioSource = this.node.addComponent(AudioSource);
        this.loadConfig();
        this.loopMusic();
    }

}


