import { _decorator, Component, Button, director, AudioSource } from 'cc';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Button)
    startButton: Button = null;

    @property(Button)
    settingsButton: Button = null;

    @property(AudioSource)
    audioSource: AudioSource = null;

    start() {
        this.startButton.node.on('click', this.onStartButtonClicked, this);
        this.settingsButton.node.on('click', this.onSettingsButtonClicked, this);
        this.updateAudioState();
    }

    onStartButtonClicked() {
        director.loadScene("LevelScene"); // 假设你的关卡场景名为 "LevelScene"
    }

    onSettingsButtonClicked() {
        director.loadScene("SettingsScene"); // 假设你的设置场景名为 "SettingsScene"
    }

    updateAudioState() {
        this.audioSource.enabled = SaveManager.getSoundState();
    }
}