// 第5关地图数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level5Map')
export class Level5Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [-1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, -1]
    ];
}