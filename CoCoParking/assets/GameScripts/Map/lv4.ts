// 第4关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level4Map')
export class Level4Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0, 0, 0, 0, 0],
        [-1, 0, 0, 0, -1],
        [0, 0, 0, 0, 0],
        [0, -1, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number}[] = [
        {outerMap: 'U0', sort: 0, type: 3},
        {outerMap: 'U4', sort: 0, type: 3}
    ];
}