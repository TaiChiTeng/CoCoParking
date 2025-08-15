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
        console.log("[CarAudio] loopMusic 开始播放背景音乐");
        console.log("[CarAudio] 音频开关状态:", this.audioConfig.isAudioOn);
        console.log("[CarAudio] bgMusics数组长度:", this.bgMusics.length);
        
        if (this.bgMusics.length === 0) {
            console.log("[CarAudio] 错误：bgMusics数组为空，无法播放背景音乐");
            return;
        }
        
        // let music = this.bgMusics[Math.floor(Math.random() * this.bgMusics.length)];
        let music = this.bgMusics[0];
        console.log("[CarAudio] 选择的音乐:", music);
        console.log("[CarAudio] 音乐clip:", music.clip);
        
        if (!music.clip) {
            console.log("[CarAudio] 错误：音乐clip为空");
            return;
        }
        
        this.musicAudioSource.clip = music.clip;
        this.musicAudioSource.volume = 0.5 * (this.audioConfig.isAudioOn ? 1.0 : 0.0);
        console.log("[CarAudio] 设置音量:", this.musicAudioSource.volume);
        this.musicAudioSource.play();
        console.log("[CarAudio] 调用play()方法完成");
        this.currMusic = music;
        this.scheduleOnce(()=>{
            this.loopMusic();
        }, music.clip.getDuration())
    }

    playCarSound() {
        console.log("[CarAudio] playCarSound 开始播放音效");
        console.log("[CarAudio] 音频开关状态:", this.audioConfig.isAudioOn);
        console.log("[CarAudio] carSounds数组长度:", this.carSounds.length);
        
        if (!this.audioConfig.isAudioOn) {
            console.log("[CarAudio] 音频已关闭，不播放音效");
            return;
        }
        
        if (this.carSounds.length === 0) {
            console.log("[CarAudio] 错误：carSounds数组为空，无法播放音效");
            return;
        }
        
        // let sound = this.carSounds[Math.floor(Math.random() * this.carSounds.length)];
        let sound = this.carSounds[0];
        console.log("[CarAudio] 选择的音效:", sound);
        console.log("[CarAudio] 音效clip:", sound.clip);
        
        if (!sound.clip) {
            console.log("[CarAudio] 错误：音效clip为空");
            return;
        }
        
        console.log("[CarAudio] AudioMgr实例:", AudioMgr.inst);
        AudioMgr.inst.playOneShot(sound.clip, 1.0);
        console.log("[CarAudio] 音效播放调用完成");
    }

    loadConfig() {
        console.log("[CarAudio] loadConfig 开始加载音频配置");
        let saveConfig = sys.localStorage.getItem(this.AUDIO_STORE_KEY);
        console.log("[CarAudio] 本地存储的配置:", saveConfig);
        if (saveConfig) {
            try {
                let loadedConfig = JSON.parse(saveConfig);
                console.log("[CarAudio] 解析后的配置:", loadedConfig);
                if (loadedConfig.version == this.STORE_VERSION) {
                    this.audioConfig = loadedConfig;
                    console.log("[CarAudio] 使用本地配置");
                } else {
                    console.log("[CarAudio] 版本不匹配，使用默认配置");
                }
            }
            catch(e) {
                console.log("[CarAudio] 音频配置解析失败，使用默认值", e);
            }
        } else {
            console.log("[CarAudio] 没有本地配置，使用默认配置");
        }
        console.log("[CarAudio] 最终音频配置:", this.audioConfig);
    }

    saveConfig() {
        let saveConfig = JSON.stringify(this.audioConfig);
        sys.localStorage.setItem(this.AUDIO_STORE_KEY, saveConfig);
    }

    onClickAudio() {
        console.log("[CarAudio] onClickAudio 切换音频开关");
        console.log("[CarAudio] 切换前状态:", this.audioConfig.isAudioOn);
        this.audioConfig.isAudioOn = !this.audioConfig.isAudioOn;
        console.log("[CarAudio] 切换后状态:", this.audioConfig.isAudioOn);
        
        if(this.audioConfig.isAudioOn){
            console.log("[CarAudio] 声音已开启");
        } else{
            console.log("[CarAudio] 声音已关闭");
        }

        this.saveConfig();
        
        // 立即应用音频开关状态到当前播放的背景音乐
        if (this.musicAudioSource) {
            let newVolume = this.audioConfig.isAudioOn ? 1.0 : 0.0;
            console.log("[CarAudio] 设置背景音乐音量:", newVolume);
            this.musicAudioSource.volume = newVolume;
        } else {
            console.log("[CarAudio] 警告：musicAudioSource为空");
        }
    }

    start() {
        console.log("[CarAudio] start 开始初始化音频管理器");
        console.log("[CarAudio] bgMusics数组:", this.bgMusics);
        console.log("[CarAudio] carSounds数组:", this.carSounds);
        
        this.musicAudioSource = this.node.addComponent(AudioSource);
        console.log("[CarAudio] 创建AudioSource组件:", this.musicAudioSource);
        
        this.loadConfig();
        console.log("[CarAudio] 配置加载完成，开始播放背景音乐");
        this.loopMusic();
    }

}


