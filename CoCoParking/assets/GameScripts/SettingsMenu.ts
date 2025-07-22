import { _decorator, Component, Toggle, Button, director, AudioSource } from 'cc';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

@ccclass('SettingsMenu')
export class SettingsMenu extends Component {
    @property(Toggle)
    soundToggle: Toggle = null;

    @property(Button)
    backButton: Button = null;

     @property(AudioSource)
    audioSource: AudioSource = null;

    start() {
        this.soundToggle.isChecked = SaveManager.getSoundState();
        this.soundToggle.node.on('toggle', this.onSoundToggleClicked, this);
        this.backButton.node.on('click', this.onBackButtonClicked, this);
    }

    onSoundToggleClicked() {
        SaveManager.saveSoundState(this.soundToggle.isChecked);
        this.audioSource.enabled = this.soundToggle.isChecked;
    }

    onBackButtonClicked() {
        director.loadScene("MainMenu"); // 返回主菜单场景
    }
}