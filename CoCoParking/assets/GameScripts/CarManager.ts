import { _decorator, Component, Node } from 'cc';
import { CarData } from './CarData';
const { ccclass, property } = _decorator;

@ccclass('CarManager')
export class CarManager extends Component {

    public cars: CarData[];

    constructor() {
        super();
    }

    /** 加载初始汽车数据 */
    public loadCars(carList: CarData[]): void {}

    /** 获取汽车纹理名 */
    public getCarTexture(car: CarData): string {}

    /** 尝试移动汽车：向前或向后 */
    public moveCar(id: number, forward: boolean): void {}

    /** 检查汽车是否已完全进入停车区域 */
    public isCarParked(car: CarData): boolean {}    

    start() {

    }

    update(deltaTime: number) {
        
    }
}


