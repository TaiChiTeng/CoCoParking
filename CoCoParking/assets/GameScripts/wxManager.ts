import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('wxManager')
export class wxManager extends Component {
    onLoad() {
        if (typeof wx !== 'undefined') {
            wx.showShareMenu({
                withShareTicket: true, // 如需获取群聊标识需开启
                menus: ['shareAppMessage', 'shareTimeline'] // 同时启用wx好友和朋友圈分享
            });
        }
    }
}


