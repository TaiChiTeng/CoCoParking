// 第3关地图数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level3Map')
export class Level3Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0, 0, 0, 0, 0],
        [-1, 0, 0, 0, -1],
        [-1, 0, 0, 0, -1],
        [-1, 0, 0, 0, -1],
        [0, 0, 0, 0, 0],
        [-1, 0, 0, 0, -1]
    ];
}