// 第5关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level5Map')
export class Level5Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0,-1, 0, 0, 0],
        [0,-1, 0, 0, 0],
        [0, 0, 0,-1, 0],
        [0, 0, 0, 0, 0],
        [0,-1, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number, inPark: number}[] = [
        {outerMap: 'U3', sort: 0, type: 2, inPark: 0},
        {outerMap: 'R2', sort: 0, type: 1, inPark: 0},
        {outerMap: 'R2', sort: 1, type: 1, inPark: 0},
        {outerMap: 'L0', sort: 0, type: 2, inPark: 0},
        {outerMap: 'L4', sort: 0, type: 1, inPark: 0}
    ];
}