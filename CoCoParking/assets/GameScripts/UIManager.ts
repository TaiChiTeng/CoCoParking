import { _decorator, Component, Node, Animation, Label } from 'cc';
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
        // 只有在通关界面当前显示时才隐藏它，避免不必要的状态变化
        if (this.UILevelClear && this.UILevelClear.active) {
            this.UILevelClear.active = false;
        }
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
        
        // 确保关卡界面显示（如果还没有显示的话）
        if (!this.UILevel.active) {
            this.UILevel.active = true;
        }
        
        // 检查并设置UILevelClear（避免重复设置）
        console.log('UILevelClear节点引用:', this.UILevelClear);
        if (this.UILevelClear) {
            if (!this.UILevelClear.active) {
                console.log('设置UILevelClear.active = true');
                this.UILevelClear.active = true;
                console.log('UILevelClear当前active状态:', this.UILevelClear.active);
                /*
                // 只在首次显示时播放动画
                console.log('animLevelClear组件引用:', this.animLevelClear);
                if (this.animLevelClear) {
                    console.log('尝试播放通关动画: AnimShowLevelClear');
                    this.animLevelClear.play('AnimShowLevelClear');
                    console.log('动画播放命令已发送');
                } else {
                    console.error('ERROR: animLevelClear动画组件未在编辑器中赋值');
                }*/
            } else {
                console.log('UILevelClear已经处于active状态，跳过重复设置');
            }
        } else {
            console.error('ERROR: UILevelClear节点未在编辑器中赋值');
        }
        
        // 输出当前所有UI节点状态
        console.log('当前UI节点状态:');
        console.log('- UIMainMenu.active:', this.UIMainMenu.active);
        console.log('- UILevel.active:', this.UILevel.active);
        console.log('- UILevelClear.active:', this.UILevelClear ? this.UILevelClear.active : 'null');
        console.log('- UISetting.active:', this.UISetting.active);
        console.log('- UIConfirm.active:', this.UIConfirm.active);
        console.log('====================================');
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
    }

    // 关卡界面打开设置界面，不关闭关卡界面
    public onLevelToSettingClick(): void {
        this.UISetting.active = true;
        // 播放设置界面动画
        if (this.animSetting) {
            this.animSetting.play('AnimShowSetting');
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
}