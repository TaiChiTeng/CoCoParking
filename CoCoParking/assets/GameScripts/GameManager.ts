import { _decorator, Component, Node, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    public UIMainMenu: Node = null;

    @property(Node)
    public UILevel: Node = null;

    @property(Node)
    public UILevelClear: Node = null;

    @property(Node)
    public UISetting: Node = null;

    @property(Node)
    public UIConfirm: Node = null;

    @property(AudioSource)
    public audioSource: AudioSource = null;

    private isSoundOn: boolean = true;

    start() {
        // 初始化时只显示主菜单
        this.showMainMenuOnly();
    }

    // 显示主菜单，隐藏其他界面
    private showMainMenuOnly(): void {
        this.UIMainMenu.active = true;
        this.UILevel.active = false;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
    }

    // 显示关卡界面，隐藏其他界面
    private showLevelOnly(): void {
        this.UIMainMenu.active = false;
        this.UILevel.active = true;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
    }

    // 显示通关界面，隐藏其他界面
    private showLevelClearOnly(): void {
        this.UIMainMenu.active = false;
        this.UILevel.active = false;
        this.UILevelClear.active = true;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
    }

    // 主菜单按钮回调函数
    public onMainMenuToLevelClick(): void {
        this.showLevelOnly();
    }

    public onMainMenuToSettingClick(): void {
        this.UISetting.active = true;
    }

    // 关卡界面按钮回调函数
    public onLevelToLevelClearClick(): void {
        this.showLevelClearOnly();
    }

    public onLevelToSettingClick(): void {
        this.UISetting.active = true;
    }

    // 通关界面按钮回调函数
    public onLevelClearToLevelClick(): void {
        this.showLevelOnly();
    }

    // 设置界面按钮回调函数
    public onSettingToConfirmClick(): void {
        // 检查关卡界面是否显示
        if (this.UILevel.active) {
            // 如果关卡界面正在显示，则打开二次确认界面
            this.UIConfirm.active = true;
        } else {
            // 如果关卡界面没有显示，则打开主界面，关闭设置界面
            this.UISetting.active = false;
            this.UIConfirm.active = false;
            this.showMainMenuOnly();
    }
}

    public onSettingSoundToggle(): void {
        this.isSoundOn = !this.isSoundOn;
        if (this.audioSource) {
            this.audioSource.volume = this.isSoundOn ? 1 : 0;
        }
    }

    public onSettingClose(): void {
        this.UISetting.active = false;
    }

    // 二次确认界面按钮回调函数
    public onConfirmToMainMenuClick(): void {
        this.UIConfirm.active = false;
        this.UISetting.active = false;
        this.showMainMenuOnly();
    }

    public onConfirmCancelClick(): void {
        this.UIConfirm.active = false;
    }

    update(deltaTime: number) {
        // 可以在这里添加需要每帧更新的逻辑
    }
}