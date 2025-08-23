import { _decorator, Component, Node, Animation, Label } from 'cc';
import { CarAudio } from './CarAudio';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
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

    @property(Animation)
    public animMainMenu: Animation = null;

    @property(Animation)
    public animLevel: Animation = null;

    @property(Animation)
    public animLevelClear: Animation = null;

    @property(Animation)
    public animSetting: Animation = null;

    @property(Animation)
    public animConfirm: Animation = null;

    @property(Label)
    public labLv: Label = null; // 关卡文本标签

    @property(Label)
    public labelParkNum: Label = null; // 停车数量标签

    @property(Node)
    public audioManagerNode: Node = null; // 音频管理器节点

    // 显示主菜单，隐藏其他界面
    public showMainMenuOnly(): void {
        this.UIMainMenu.active = true;
        this.UILevel.active = false;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
        // 播放主菜单动画
        if (this.animMainMenu) {
            this.animMainMenu.play('AnimShowMainMenu');
        }
    }

    // 显示关卡界面，隐藏其他界面
    public showLevelOnly(): void {
        this.UIMainMenu.active = false;
        this.UILevel.active = true;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
        // 播放关卡界面动画
        if (this.animLevel) {
            this.animLevel.play('AnimShowLevel');
        }
    }

    // 显示通关界面，不用隐藏关卡界面，隐藏其他界面
    public showLevelClearOnly(): void {
        console.log('===== 调用showLevelClearOnly方法 =====');
        
        // 先隐藏其他界面，避免界面闪烁
        this.UIMainMenu.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
       
        this.UILevelClear.active = true;
        // 播放关卡界面动画
        if (this.animLevelClear) {
            this.animLevelClear.play('AnimShowLevelClear');
        }
    }

    // 初始化关卡文本标签引用
    public initLevelLabel(): void {
        if (this.UILevel) {
            const animNode = this.UILevel.getChildByName('AnimNode');
            if (animNode) {
                const nodeLv = animNode.getChildByName('nodeLv');
                if (nodeLv) {
                    const findlabLv = nodeLv.getChildByName('labLv');
                    if(findlabLv){
                        this.labLv = findlabLv.getComponent(Label);
                        if (!this.labLv) {
                            console.error('Cannot find Label component on nodeLv');
                        }
                    }else {
                        console.error('Cannot find labLv under nodeLv');
                    }
                    
                    // 初始化停车数量标签
                    const findlabelParkNum = nodeLv.getChildByName('labelParkNum');
                    if(findlabelParkNum){
                        this.labelParkNum = findlabelParkNum.getComponent(Label);
                        if (!this.labelParkNum) {
                            console.error('Cannot find Label component on labelParkNum');
                        }
                    }else {
                        console.error('Cannot find labelParkNum under nodeLv');
                    }
                } else {
                    console.error('Cannot find nodeLv under AnimNode');
                }
            } else {
                console.error('Cannot find AnimNode under UILevel');
            }
        }
    }

    // 更新关卡文本
    public updateLevelLabel(level: number, totalLevels: number): void {
        if (this.labLv) {
            // 检查关卡是否超出范围
            if (level > totalLevels) {
                this.labLv.string = "无限关卡";
            } else {
                this.labLv.string = `关卡 ${level}`;
            }
        } else {
            console.warn('labLv is not initialized, trying to find it again');
            // 如果标签未初始化，尝试重新查找
            this.initLevelLabel();
            // 再次尝试更新
            if (this.labLv) {
                // 检查关卡是否超出范围
                if (level > totalLevels) {
                    this.labLv.string = "无限关卡";
                } else {
                    this.labLv.string = `关卡 ${level}`;
                }
            }
        }
    }

    // 主菜单打开设置界面，不关闭主菜单
    public onMainMenuToSettingClick(): void {
        this.UISetting.active = true;
        // 播放设置界面动画
        if (this.animSetting) {
            this.animSetting.play('AnimShowSetting');
        }
        // 更新音频按钮状态
        if (this.audioManagerNode) {
            const carAudio = this.audioManagerNode.getComponent(CarAudio);
            if (carAudio) {
                carAudio.updateAudioButtonState();
            }
        }
    }

    // 关卡界面打开设置界面，不关闭关卡界面
    public onLevelToSettingClick(): void {
        this.UISetting.active = true;
        // 播放设置界面动画
        if (this.animSetting) {
            this.animSetting.play('AnimShowSetting');
        }
        // 更新音频按钮状态
        if (this.audioManagerNode) {
            const carAudio = this.audioManagerNode.getComponent(CarAudio);
            if (carAudio) {
                carAudio.updateAudioButtonState();
            }
        }
    }

    // 设置界面按钮回调函数
    public onSettingToConfirmClick(): boolean {
        // 检查关卡界面是否显示
        if (this.UILevel.active) {
            // 如果关卡界面正在显示，则打开二次确认界面
            this.UIConfirm.active = true;
            // 播放确认界面动画
            if (this.animConfirm) {
                this.animConfirm.play('AnimShowConfirm');
            }
            return true;
        } else {
            // 如果关卡界面没有显示，则主界面是打开着的，直接关闭设置界面
            this.UISetting.active = false;
            return false;
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

    // 更新停车数量标签
    public updateParkNumLabel(successfulParks: number, totalCars: number): void {
        if (this.labelParkNum) {
            this.labelParkNum.string = `已停好汽车数量：${successfulParks}/${totalCars}`;
        } else {
            console.warn('labelParkNum is not initialized, trying to find it again');
            // 如果标签未初始化，尝试重新查找
            this.initLevelLabel();
            // 再次尝试更新
            if (this.labelParkNum) {
                this.labelParkNum.string = `已停好汽车数量：${successfulParks}/${totalCars}`;
            }
        }
    }
}