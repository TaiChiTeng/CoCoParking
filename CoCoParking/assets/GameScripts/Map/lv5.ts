// 第5关地图数据和汽车数据
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

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number}[] = [
        {outerMap: 'U0', sort: 0, type: 3}
    ];
}