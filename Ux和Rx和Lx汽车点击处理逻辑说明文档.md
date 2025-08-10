# Ux、Rx、Lx汽车点击处理逻辑 - Literate Programming

> 本文档采用文学编程（Literate Programming）风格，将代码实现与逻辑说明紧密结合，
> 通过代码块的组织和解释来展现Ux汽车点击处理的完整程序结构。

## 1. 程序概述与数据结构定义

我们首先定义Ux、Rx、Lx汽车点击处理系统的核心数据结构。
Ux汽车是指从停车场下方向上进入的汽车，可以向上或向下移动。
Rx汽车是指从停车场左方向右进入的汽车，可以向右或向左移动。
Lx汽车是指从停车场右方向左进入的汽车，可以向左或向右移动。

```typescript
// <<汽车停放信息接口>>=
interface CarParkingInfo {
    outerMap: string;    // 汽车所属区域（如"U0", "U1", "R0", "R1", "L0", "L1"等）
    sort: number;        // 汽车在该区域的排序索引
    type: number;        // 汽车类型（1-3，表示汽车长度）
    headMap: number;     // 车头在地图中的位置
    tailMap: number;     // 车尾在地图中的位置
    node: Node;          // 汽车节点引用
    inPark: number;      // 0: 在停车场外, 1: 在停车场内
}
```

汽车的移动状态通过枚举来表示，这样可以清晰地表达所有可能的移动情况：

```typescript
// <<汽车移动状态枚举>>=
enum CarMovementStatus {
    CANNOT_MOVE,           // 无法移动
    CAN_MOVE_UP,           // 可以向上移动
    CAN_MOVE_DOWN,         // 可以向下移动
    CAN_MOVE_DOWN_IN_PARK, // 可以向下移动（停在停车场内）
    CAN_MOVE_DOWN_OUT_PARK // 可以向下移动（停在停车场外）
    
    Rx_CAN_MOVE_RIGHT,           // Rx可以向右移动
    Rx_CAN_MOVE_LEFT_IN_PARK,   // Rx可以向左移动（停在停车场内）
    Rx_CAN_MOVE_LEFT_OUT_PARK,  // Rx可以向左移动（停在停车场外）
    Rx_CAN_MOVE_LEFT,            // Rx可以向左移动

    Lx_CAN_MOVE_LEFT,            // Lx可以向左移动
    Lx_CAN_MOVE_RIGHT_IN_PARK,    // Lx可以向左移动（停在停车场内）
    Lx_CAN_MOVE_RIGHT_OUT_PARK,   // Lx可以向左移动（停在停车场外）
    Lx_CAN_MOVE_RIGHT,           // Lx可以向右移动
}
```

## 2. 主程序入口：点击事件处理

当用户点击汽车时，系统需要执行一系列检查和操作。这是整个处理流程的入口点：

```typescript
// <<处理汽车点击事件>>=
private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number): void {
    // 防止动画播放期间的重复点击
    <<检查动画状态>>
    
    // 获取汽车的完整信息
    <<获取汽车停放信息>>
    
    // 获取当前地图数据
    <<获取地图数据>>
    
    // 计算汽车可以如何移动
    <<计算移动状态>>
    
    // 执行具体的移动操作
    <<执行移动操作>>
}
```

让我们逐一实现这些组件：

```typescript
// <<检查动画状态>>=
if (this.isAnimationPlaying) {
    return; // 如果动画正在播放，直接返回
}
```

```typescript
// <<获取汽车停放信息>>=
const outerMap = parentNode.name; // 从父节点名称提取区域信息
const parkingInfo = this.findCarParkingInfo(outerMap, sort);
if (!parkingInfo) {
    console.error('未找到汽车停放信息');
    return;
}
```

```typescript
// <<获取地图数据>>=
const mapData = MapData.getInstance().getCurrentLevelData();
const map = mapData.map;
const mapH = mapData.mapH;
const mapW = mapData.mapW;
console.log('地图数据:', map);
console.log('停车场高度:', mapH);
console.log('停车场宽度:', mapW);
```

## 3. 移动状态计算：核心决策逻辑

移动状态计算是整个系统的核心，它决定了汽车可以如何移动：

```typescript
// <<计算移动状态>>=
const movementStatus = this.calculateUpCarMovementStatus(parkingInfo, mapData, outerMap);
```

移动状态计算的完整实现如下：

```typescript
// <<计算Ux、Rx、Lx汽车移动状态>>=
private calculateUpCarMovementStatus(
    parkingInfo: CarParkingInfo, 
    mapData: any, 
    outerMap: string
): CarMovementStatus {
    const map = mapData.map;
    const mapH = mapData.mapH;
    const mapW = mapData.mapW;
    const x = this.getCarColumnPosition(outerMap);
    const y = this.getCarRowPosition(outerMap);
    
    // 如果是Ux汽车
    // 首先检查是否可以向上移动
    if (<<Ux可以向上移动检查>>) {
        return CarMovementStatus.CAN_MOVE_UP;
    }
    // 如果是Ux汽车
    // 如果不能向上移动，检查向下移动的可能性
    return <<Ux向下移动状态判断>>;


    // 如果是Rx汽车
    // 首先检查是否可以向右移动
    if (<<Rx可以向右移动检查>>) {
        return CarMovementStatus.Rx_CAN_MOVE_RIGHT;

    }
    // 如果是Rx汽车
    // 如果不能向右移动，检查向左移动的可能性
    return <<Rx向左移动状态判断>>;

    // 如果是Lx汽车
    // 首先检查是否可以向左移动
    if (<<Lx可以向左移动检查>>) {
        return CarMovementStatus.Lx_CAN_MOVE_LEFT;
    }
    // 如果是Lx汽车
    // 如果不能向左移动，检查向右移动的可能性
    return <<Lx向右移动状态判断>>;
}
```

### 3.1 Ux向上移动能力检查

Ux向上移动的检查需要考虑边界条件和位置占用情况：

```typescript
// <<Ux可以向上移动检查>>=

this.canCarMoveUp(parkingInfo, map, x)
```

```typescript
// <<向上移动能力检查实现>>=
private canCarMoveUp(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
    // 基础边界检查
    <<基础边界检查>>
    
    // 位置有效性检查
    <<位置有效性检查>>
    
    // 停车场外特殊处理
    <<停车场外特殊处理>>
    
    return true;
}
```

```typescript
// <<基础边界检查>>=
if (parkingInfo.headMap === 0) {
    return false; // 车头已在地图顶部，无法继续向上
}
```

```typescript
// <<位置有效性检查>>=
const rowIndex = parkingInfo.headMap - 1;
if (!this.isValidMapPosition(map, rowIndex, x) || map[rowIndex][x] !== 0) {
    return false; // 上方位置无效或被占用
}
```

```typescript
// <<停车场外特殊处理>>=
const isCarOutsidePark = parkingInfo.headMap >= mapH;
if (isCarOutsidePark) {
    const upperPosition = parkingInfo.headMap - 1;
    if (upperPosition >= 0) {
        // 检查停车场内位置
        if (upperPosition < mapH && map[upperPosition][x] !== 0) {
            return false;
        }
        // 检查停车场外其他汽车
        if (upperPosition >= mapH) {
            const hasCarAbove = this.carParkingInfos.some(carInfo => 
                carInfo.outerMap === parkingInfo.outerMap && 
                carInfo !== parkingInfo && 
                carInfo.headMap <= upperPosition && 
                carInfo.tailMap >= upperPosition
            );
            if (hasCarAbove) {
                return false;
            }
        }
    }
}
```

### 3.2 Ux向下移动状态判断

当汽车Ux无法向上移动时，我们需要判断向下移动的可能性：

```typescript
// <<Ux向下移动状态判断>>=

// 检查阻塞条件
const tailBelowRow = parkingInfo.tailMap + 1;
const tailBelowBlocked = tailBelowRow < mapH && map[tailBelowRow][x] !== 0;
const headAlreadyOutside = parkingInfo.headMap < 0;
const carAlreadyOutside = parkingInfo.headMap >= mapH;

if (tailBelowBlocked || headAlreadyOutside || carAlreadyOutside) {
    return CarMovementStatus.CANNOT_MOVE;
}

// 预测停车位置
<<停车位置预测算法>>
```

```typescript
// <<停车位置预测算法>>=
let carStopsOutside = true;
for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
    if (map[index][x] !== 0) {
        console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
        carStopsOutside = false;
        break;
    }
}

return carStopsOutside ? 
    CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK : 
    CarMovementStatus.CAN_MOVE_DOWN_IN_PARK;
```

### 3.3 Rx向右移动能力检查

Rx向右移动的检查需要考虑边界条件和位置占用情况：

```typescript
// <<Rx可以向右移动检查>>=

this.RxCanCarMoveRight(parkingInfo, map, x)
```

```typescript
// <<Rx向右移动能力检查实现>>=
private RxCanCarMoveRight(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
    // 基础边界检查
    <<基础边界检查>>
    
    // 位置有效性检查
    <<位置有效性检查>>
    
    // 停车场外特殊处理
    <<停车场外特殊处理>>
    
    return true;
}
```

```typescript
// <<基础边界检查>>=
if (parkingInfo.headMap === mapW - 1) {
    return false; // 车头已在地图右侧，无法继续向右
}
```

```typescript
// <<位置有效性检查>>=
const colIndex = parkingInfo.headMap + 1;
if (!this.isValidMapPosition(map, x, colIndex) || map[x][colIndex] !== 0) {
    return false; // 右侧位置无效或被占用
}
```

```typescript
// <<停车场外特殊处理>>=
const isCarOutsidePark = parkingInfo.headMap < 0;
if (isCarOutsidePark) {
    const rightPosition = parkingInfo.headMap + 1;
    if (rightPosition >= 0) {
        // 检查停车场内位置
        if (rightPosition < mapW && map[x][rightPosition] !== 0) {
            return false;
        }
        // 检查停车场外其他汽车
        if (rightPosition < 0) {
            const hasCarLeft = this.carParkingInfos.some(carInfo => 
                carInfo.outerMap === parkingInfo.outerMap && 
                carInfo !== parkingInfo && 
                carInfo.headMap >= rightPosition && 
                carInfo.tailMap <= rightPosition
            );
            if (hasCarLeft) {
                return false;
            }
        }
    }
}
```

### 3.4 Rx向左移动状态判断

当汽车Rx无法向右移动时，我们需要判断向左移动的可能性：


```typescript
// <<Rx向左移动状态判断>>=

// 检查阻塞条件
const tailLeftCol = parkingInfo.tailMap - 1;
const tailLeftBlocked = tailLeftCol >= 0 && map[x][tailLeftCol] !== 0;
const headAlreadyOutside = parkingInfo.headMap > mapW - 1;
const carAlreadyOutside = parkingInfo.headMap < 0;

if (tailLeftBlocked || headAlreadyOutside || carAlreadyOutside) {
    return CarMovementStatus.CANNOT_MOVE;
}

// 预测停车位置
<<停车位置预测算法>>
```

```typescript
// <<停车位置预测算法>>=
let carStopsOutside = true;
for (let index = parkingInfo.tailMap - 1; index >= 0; index--) {
    if (map[x][index] !== 0) {
        console.log(`车尾会停在${index + 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
        carStopsOutside = false;
        break;
    }
}

return carStopsOutside ? 
    CarMovementStatus.Rx_CAN_MOVE_LEFT_OUT_PARK : 
    CarMovementStatus.Rx_CAN_MOVE_LEFT_IN_PARK;
```

### 3.5 Lx向左移动能力检查

Lx向左移动的检查需要考虑边界条件和位置占用情况：

```typescript
// <<Lx可以向左移动检查>>=
this.LxCanCarMoveLeft(parkingInfo, map, x)
```

```typescript
// <<Lx向左移动能力检查实现>>=
private LxCanCarMoveLeft(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
    // 基础边界检查
    <<基础边界检查>>
    
    // 位置有效性检查
    <<位置有效性检查>>
    
    // 停车场外特殊处理
    <<停车场外特殊处理>>
    
    return true;
}
```

```typescript
// <<基础边界检查>>=
if (parkingInfo.headMap === 0) {
    return false; // 车头已在地图左侧，无法继续向左
}
```

```typescript
// <<位置有效性检查>>=
const colIndex = parkingInfo.headMap - 1;
if (!this.isValidMapPosition(map, x, colIndex) || map[x][colIndex] !== 0) {
    return false; // 左侧位置无效或被占用
}
```

```typescript
// <<停车场外特殊处理>>=
const isCarOutsidePark = parkingInfo.headMap >= mapW;
if (isCarOutsidePark) {
    const leftPosition = parkingInfo.headMap - 1;
    if (leftPosition >= 0) {
        // 检查停车场内位置
        if (leftPosition < mapW && map[x][leftPosition] !== 0) {
            return false;
        }
        // 检查停车场外其他汽车
        if (leftPosition < 0) {
            const hasCarLeft = this.carParkingInfos.some(carInfo => 
                carInfo.outerMap === parkingInfo.outerMap && 
                carInfo !== parkingInfo && 
                carInfo.headMap <= leftPosition && 
                carInfo.tailMap >= leftPosition
            );
            if (hasCarLeft) {
                return false;
            }
        }
    }
}
```

### 3.6 Lx向右移动状态判断

当汽车Lx无法向左移动时，我们需要判断向右移动的可能性：

```typescript
// <<Lx向右移动状态判断>>=

// 检查阻塞条件
const tailRightCol = parkingInfo.tailMap + 1;
const tailRightBlocked = tailRightCol < mapW && map[x][tailRightCol] !== 0;
const headAlreadyOutside = parkingInfo.headMap < 0;
const carAlreadyOutside = parkingInfo.headMap >= mapH;

if (tailRightBlocked || headAlreadyOutside || carAlreadyOutside) {
    return CarMovementStatus.CANNOT_MOVE;
}

// 预测停车位置
<<停车位置预测算法>>
```

```typescript
// <<停车位置预测算法>>=
let carStopsOutside = true;
for (let index = parkingInfo.tailMap + 1; index < mapW; index++) {
    if (map[x][index] !== 0) {
        console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
        carStopsOutside = false;
        break;
    }
}

return carStopsOutside ? 
    CarMovementStatus.Lx_CAN_MOVE_RIGHT_OUT_PARK : 
    CarMovementStatus.Lx_CAN_MOVE_RIGHT_IN_PARK;
```

## 4. 移动执行：具体操作实现

根据计算出的移动状态，执行相应的移动操作：

```typescript
// <<执行移动操作>>=
this.executeCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
```

```typescript
// <<移动执行分发器>>=
private executeCarMovement(
    carNode: Node, 
    parkingInfo: CarParkingInfo, 
    mapData: any, 
    outerMap: string, 
    movementStatus: CarMovementStatus
): void {
    const map = mapData.map;
    const mapH = mapData.mapH;
    const x = this.getCarColumnPosition(outerMap);
    const y = this.getCarRowPosition(outerMap);
    
    switch (movementStatus) {
        case CarMovementStatus.CAN_MOVE_UP:
            <<执行向上移动>>
            break;
        case CarMovementStatus.CAN_MOVE_DOWN_IN_PARK:
            <<执行向下移动到停车场内>>
            break;
        case CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK:
            <<执行向下移出停车场>>
            break;
        case CarMovementStatus.Rx_CAN_MOVE_RIGHT:
            <<执行Rx向右移动>>
            break;
        case CarMovementStatus.Rx_CAN_MOVE_RIGHT_IN_PARK:
            <<执行Rx向右移动到停车场内>>
            break;
        case CarMovementStatus.Rx_CAN_MOVE_RIGHT_OUT_PARK:
            <<执行Rx向右移出停车场>>
            break;
        case CarMovementStatus.Lx_CAN_MOVE_LEFT:
            <<执行Lx向左移动>>
            break;
        case CarMovementStatus.Lx_CAN_MOVE_LEFT_IN_PARK:
            <<执行Lx向左移动到停车场内>>
            break;
        case CarMovementStatus.Lx_CAN_MOVE_LEFT_OUT_PARK:
            <<执行Lx向左移出停车场>>
            break;

        default:
            console.log('汽车无法移动');
    }
}
```

### 4.1 向上移动实现

```typescript
// <<执行向上移动>>=
console.log('执行向上移动');
this.moveCarUp(parkingInfo, map, mapH, x);
```

```typescript
// <<向上移动核心逻辑>>=
private moveCarUp(parkingInfo: CarParkingInfo, map: number[][], mapH: number, x: number): void {
    const oldHead = parkingInfo.headMap;
    
    // 计算新的车头位置（尽可能向上移动）
    <<计算新车头位置>>
    
    // 检查是否需要连带移动
    <<检查连带移动条件>>
    
    // 更新汽车位置
    <<更新汽车位置信息>>
    
    // 同步地图状态
    <<同步地图状态>>
    
    // 播放移动动画
    <<播放向上移动动画>>
}
```

```typescript
// <<计算新车头位置>>=
let newHeadPos = parkingInfo.headMap - 1;
for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
    if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
        break; // 遇到障碍物停止
    }
    newHeadPos = index; // 继续向上移动
}
console.log('新车头位置:', newHeadPos);
console.log('旧车头位置:', oldHead);
```

```typescript
// <<检查连带移动条件>>=
const hasPartOutsidePark = parkingInfo.tailMap >= mapH;
console.log('是否有部分在停车场外:', hasPartOutsidePark);
if (hasPartOutsidePark) {
    <<触发向上连带移动>>
}
```

### 4.2 向下移动到停车场内实现

```typescript
// <<执行向下移动到停车场内>>=
console.log('执行向下移动（停车场内）');
this.moveCarDown(parkingInfo, map, mapH, x);
```

```typescript
// <<向下移动核心逻辑>>=
private moveCarDown(parkingInfo: CarParkingInfo, map: number[][], mapH: number, x: number): void {
    // 重新计算停车位置
    <<重新计算停车位置>>
    
    // 更新位置信息
    <<更新向下移动位置>>
    
    
    // 播放动画
    <<播放向下移动动画>>
}
```

### 4.3 向下移出停车场实现

```typescript
// <<执行向下移出停车场>>=
console.log('执行向下移出停车场');
this.moveCarDownOutPark(parkingInfo, map, mapH, x, outerMap);
```

```typescript
// <<移出停车场核心逻辑>>=
private moveCarDownOutPark(
    parkingInfo: CarParkingInfo, 
    map: number[][], 
    mapH: number, 
    x: number, 
    outerMap: string
): void {
    const oldHead = parkingInfo.headMap;
    
    // 直接移动到停车场外
    <<直接移出到停车场外>>
    
    // 清理停车场内的原位置
    <<清理停车场内位置>>
    
    // 触发连带移动
    <<触发向下连带移动>>
    
    // 播放动画
    <<播放移出动画>>
}
```

### 4.4 Rx向右移动实现

```typescript
// <<执行Rx向右移动>>=
console.log('执行Rx向右移动');
this.moveRxCarRight(parkingInfo, map, mapW, y);
```

```typescript
// <<Rx向右移动核心逻辑>>=
private moveRxCarRight(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): void {
    const oldHead = parkingInfo.headMap;
    
    // 计算新的车头位置（尽可能向右移动）
    <<计算新车头位置>>
    
    // 检查是否需要连带移动
    <<检查连带移动条件>>
    
    // 更新汽车位置
    <<更新汽车位置信息>>
    
    // 同步地图状态
    <<同步地图状态>>
    
    // 播放移动动画
    <<播放向右移动动画>>
}
```

```typescript
// <<计算新车头位置>>=
let newHeadPos = parkingInfo.headMap + 1;
for (let index = parkingInfo.headMap + 1; index < mapW; index++) {
    if (this.isValidMapPosition(map, y, index) && map[y][index] !== 0) {
        break; // 遇到障碍物停止
    }
    newHeadPos = index; // 继续向右移动
}
console.log('新车头位置:', newHeadPos);
console.log('旧车头位置:', oldHead);
```

```typescript
// <<检查连带移动条件>>=
const hasPartOutsidePark = parkingInfo.tailMap < 0;
console.log('是否有部分在停车场外:', hasPartOutsidePark);
if (hasPartOutsidePark) {
    <<触发向右连带移动>>
}
```

### 4.5 Rx向左移动到停车场内实现

```typescript
// <<执行Rx向左移动到停车场内>>=
console.log('执行Rx向左移动（停车场内）');
this.moveRxCarLeft(parkingInfo, map, mapW, y);
```

```typescript
// <<向下移动核心逻辑>>=
private moveRxCarLeft(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): void {
    // 重新计算停车位置
    <<重新计算停车位置>>
    
    // 更新位置信息
    <<更新向左移动位置>>
    
    // 播放动画
    <<播放向左移动动画>>
}
```

### 4.6 Rx向左移出停车场实现

```typescript
// <<执行Rx向左移出停车场>>=
console.log('执行Rx向左移出停车场');
this.moveRxCarLeftOutPark(parkingInfo, map, mapW, y, outerMap);
```

```typescript
// <<移出停车场核心逻辑>>=
private moveRxCarLeftOutPark(
    parkingInfo: CarParkingInfo, 
    map: number[][], 
    mapW: number, 
    y: number, 
    outerMap: string
): void {
    const oldHead = parkingInfo.headMap;
    
    // 直接移动到停车场外
    <<直接移出到停车场外>>
    
    // 清理停车场内的原位置
    <<清理停车场内位置>>
    
    // 触发连带移动
    <<触发向左连带移动>>
    
    // 播放动画
    <<播放移出动画>>
}
```

### 4.7 Lx向左移动实现

```typescript
// <<执行Lx向左移动>>=
console.log('执行Lx向左移动');
this.moveLxCarLeft(parkingInfo, map, mapW, y);
```

```typescript
// <<向左移动核心逻辑>>=
private moveLxCarLeft(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): void {
    const oldHead = parkingInfo.headMap;
    
    // 计算新的车头位置（尽可能向左移动）
    <<计算新车头位置>>
    
    // 检查是否需要连带移动
    <<检查连带移动条件>>
    
    // 更新汽车位置
    <<更新汽车位置信息>>
    
    // 同步地图状态
    <<同步地图状态>>
    
    // 播放移动动画
    <<播放向左移动动画>>
}
```

```typescript
// <<计算新车头位置>>=
let newHeadPos = parkingInfo.headMap - 1;
for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
    if (this.isValidMapPosition(map, y, index) && map[y][index] !== 0) {
        break; // 遇到障碍物停止
    }
    newHeadPos = index; // 继续向左移动
}
console.log('新车头位置:', newHeadPos);
console.log('旧车头位置:', oldHead);
```

```typescript
// <<检查连带移动条件>>=
const hasPartOutsidePark = parkingInfo.tailMap >= mapW;
console.log('是否有部分在停车场外:', hasPartOutsidePark);
if (hasPartOutsidePark) {
    <<触发向左连带移动>>
}
```

### 4.8 Lx向右移动到停车场内实现

```typescript
// <<执行Lx向右移动到停车场内>>=
console.log('执行Lx向右移动（停车场内）');
this.moveLxCarRight(parkingInfo, map, mapW, y);
```

```typescript
// <<向右移动核心逻辑>>=
private moveLxCarRight(parkingInfo: CarParkingInfo, map: number[][], mapW: number, y: number): void {
    // 重新计算停车位置
    <<重新计算停车位置>>
    
    // 更新位置信息
    <<更新向右移动位置>>

    // 播放动画
    <<播放向右移动动画>>
}
```

### 4.9 Lx向右移出停车场实现

```typescript
// <<执行Lx向右移出停车场>>=
console.log('执行Lx向右移出停车场');
this.moveLxCarRightOutPark(parkingInfo, map, mapW, y, outerMap);
```

```typescript
// <<移出停车场核心逻辑>>=
private moveLxCarRightOutPark(
    parkingInfo: CarParkingInfo, 
    map: number[][], 
    mapW: number, 
    y: number, 
    outerMap: string
): void {
    const oldHead = parkingInfo.headMap;
    
    // 直接移动到停车场外
    <<直接移出到停车场外>>
    
    // 清理停车场内的原位置
    <<清理停车场内位置>>
    
    // 触发连带移动
    <<触发向右连带移动>>
    
    // 播放动画
    <<播放移出动画>>
}
```

## 5. 连带移动机制：保持汽车队列有序

当汽车在停车场外移动时，需要确保同区域内的其他汽车保持有序排列：

### 5.1 向上连带移动实现

```typescript
// <<触发向上连带移动>>=
this.moveSimilarCarsWithHigherSortUp(parkingInfo.outerMap, parkingInfo.sort, map, mapH);
```

```typescript
// <<向上连带移动实现>>=
private moveSimilarCarsWithHigherSortUp(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapH: number
): void {
    console.log('触发连带移动，区域:', outerMap, 'sort值:', currentSort);
    
    // 筛选需要移动的汽车
    <<筛选连带移动汽车>>
    
    // 执行连带移动
    <<执行向上连带移动>>
}
```

```typescript
// <<筛选连带移动汽车>>=
const carsToMove = this.carParkingInfos.filter(carInfo => 
    carInfo.outerMap === outerMap && 
    carInfo.sort > currentSort && 
    carInfo.headMap >= mapH
);
console.log('需要移动的汽车:', carsToMove.length, '辆');
```

```typescript
// <<执行向上连带移动>>=
carsToMove.forEach(carInfo => {
    const newHeadPos = carInfo.headMap - 1;
    const newTailPos = newHeadPos + carInfo.type - 1;
    
    carInfo.headMap = newHeadPos;
    carInfo.tailMap = newTailPos;
    
    this.playCarMoveAnimation(carInfo.carId, 'up');
});
```

### 5.2 向下连带移动实现

向下连带移动需要确保汽车之间的紧密相邻：

```typescript
// <<触发向下连带移动>>=
this.moveSimilarCarsWithHigherSortDown(
    outerMap, 
    parkingInfo.sort, 
    map, 
    mapH, 
    parkingInfo.tailMap
);
```

```typescript
// <<向下连带移动实现>>=
private moveSimilarCarsWithHigherSortDown(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapH: number, 
    newTailPos: number
): void {
    const carsToMove = this.carParkingInfos.filter(carInfo => 
        carInfo.outerMap === outerMap && 
        carInfo.sort > currentSort && 
        carInfo.headMap >= mapH
    );
    
    // 确保汽车紧密相邻排列
    <<确保紧密相邻排列>>
}
```

```typescript
// <<确保紧密相邻排列>>=
let nextCarHeadPos = newTailPos + 1;
carsToMove.forEach(carInfo => {
    carInfo.headMap = nextCarHeadPos;
    carInfo.tailMap = nextCarHeadPos + carInfo.type - 1;
    
    this.playCarMoveAnimation(carInfo.carId, 'down');
    
    nextCarHeadPos = carInfo.tailMap + 1; // 下一辆车紧邻当前车
});
```

### 5.3 Rx向右连带移动实现

```typescript
// <<触发Rx向右连带移动>>=
this.moveRxSimilarCarsWithHigherSortRight(parkingInfo.outerMap, parkingInfo.sort, map, mapW);

```

```typescript
// <<Rx向右连带移动实现>>=
private moveRxSimilarCarsWithHigherSortRight(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapW: number
): void {
    console.log('触发连带移动，区域:', outerMap, 'sort值:', currentSort);
    
    // 筛选需要移动的汽车
    <<筛选连带移动汽车>>
    
    // 执行连带移动
    <<执行Rx向右连带移动>>
}
```

```typescript
// <<筛选连带移动汽车>>=
const carsToMove = this.carParkingInfos.filter(carInfo => 
    carInfo.outerMap === outerMap && 
    carInfo.sort > currentSort && 
    carInfo.headMap < 0
);
console.log('需要移动的汽车:', carsToMove.length, '辆');
```

```typescript
// <<执行Rx向右连带移动>>=
carsToMove.forEach(carInfo => {
    const newHeadPos = carInfo.headMap + 1;
    const newTailPos = newHeadPos - carInfo.type + 1;
    
    carInfo.headMap = newHeadPos;
    carInfo.tailMap = newTailPos;
    
    this.playCarMoveAnimation(carInfo.carId, 'right');
});
```

### 5.4 Rx向左连带移动实现

Rx向左连带移动需要确保汽车之间的紧密相邻：

```typescript
// <<触发Rx向左连带移动>>=
this.moveRxSimilarCarsWithHigherSortLeft(
    outerMap, 
    parkingInfo.sort, 
    map, 
    mapW, 
    parkingInfo.tailMap
);
```

```typescript
// <<Rx向左连带移动实现>>=
private moveRxSimilarCarsWithHigherSortLeft(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapW: number, 
    newTailPos: number
): void {
    const carsToMove = this.carParkingInfos.filter(carInfo => 
        carInfo.outerMap === outerMap && 
        carInfo.sort > currentSort && 
        carInfo.headMap < 0
    );
    
    // 确保汽车紧密相邻排列
    <<确保紧密相邻排列>>
}
```

```typescript
// <<确保紧密相邻排列>>=
let nextCarHeadPos = newTailPos - 1;
carsToMove.forEach(carInfo => {
    carInfo.headMap = nextCarHeadPos;
    carInfo.tailMap = nextCarHeadPos - carInfo.type + 1;
    
    this.playCarMoveAnimation(carInfo.carId, 'left');
    
    nextCarHeadPos = carInfo.tailMap - 1; // 下一辆车紧邻当前车
});
```

### 5.5 Lx向左连带移动实现

```typescript
// <<触发Lx向左连带移动>>=
this.moveLxSimilarCarsWithHigherSortLeft(parkingInfo.outerMap, parkingInfo.sort, map, mapW);
```

```typescript
// <<Lx向左连带移动实现>>=
private moveLxSimilarCarsWithHigherSortLeft(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapW: number
): void {
    console.log('触发连带移动，区域:', outerMap, 'sort值:', currentSort);
    
    // 筛选需要移动的汽车
    <<筛选连带移动汽车>>
    
    // 执行连带移动
    <<执行Lx向左连带移动>>
}
```

```typescript
// <<筛选连带移动汽车>>=
const carsToMove = this.carParkingInfos.filter(carInfo => 
    carInfo.outerMap === outerMap && 
    carInfo.sort > currentSort && 
    carInfo.tailMap >= mapW
);
console.log('需要移动的汽车:', carsToMove.length, '辆');
```

```typescript
// <<执行Lx向左连带移动>>=
carsToMove.forEach(carInfo => {
    const newHeadPos = carInfo.headMap - 1;
    const newTailPos = newHeadPos + carInfo.type - 1;
    
    carInfo.headMap = newHeadPos;
    carInfo.tailMap = newTailPos;
    
    this.playCarMoveAnimation(carInfo.carId, 'left');
});
```

### 5.6 Lx向右连带移动实现

Lx向右连带移动需要确保汽车之间的紧密相邻：

```typescript
// <<触发Lx向右连带移动>>=
this.moveLxSimilarCarsWithHigherSortRight(
    outerMap, 
    parkingInfo.sort, 
    map, 
    mapW, 
    parkingInfo.tailMap
);
```

```typescript
// <<Lx向右连带移动实现>>=
private moveLxSimilarCarsWithHigherSortRight(
    outerMap: number, 
    currentSort: number, 
    map: number[][], 
    mapW: number, 
    newTailPos: number
): void {
    const carsToMove = this.carParkingInfos.filter(carInfo => 
        carInfo.outerMap === outerMap && 
        carInfo.sort > currentSort && 
        carInfo.headMap >= mapW
    );
    
    // 确保汽车紧密相邻排列
    <<确保紧密相邻排列>>
}
```

```typescript
// <<确保紧密相邻排列>>=
let nextCarHeadPos = newTailPos + 1;
carsToMove.forEach(carInfo => {
    carInfo.headMap = nextCarHeadPos;
    carInfo.tailMap = nextCarHeadPos + carInfo.type - 1;
    
    this.playCarMoveAnimation(carInfo.carId, 'right');
    
    nextCarHeadPos = carInfo.tailMap + 1; // 下一辆车紧邻当前车
});
```

## 6. 地图状态同步：维护数据一致性

```typescript
// <<同步地图状态>>=
// 这里还没有分Ux/Rx/Lx的情况处理，需要仔细看看如何修改
this.updateMapForCarMovement(
    map, 
    newHeadPos, 
    newTailPos, 
    oldHead, 
    oldTail, 
    x,
    y, 
    parkingInfo.type
);
```

```typescript
// <<地图更新实现>>=
private updateMapForCarMovement(
    map: number[][], 
    newHeadPos: number, 
    newTailPos: number, 
    oldHeadPos: number, 
    oldTailPos: number, 
    x: number, 
    y: number, 
    carType: number
): void {
    // 根据车的类型清除旧位置
    <<清除地图旧位置>>
    
    // 根据车的类型设置新位置
    <<设置地图新位置>>
    
    console.log('地图更新完成，新位置:', newHeadPos, '-', newTailPos);
}
```

```typescript
// <<Ux汽车-清除地图旧位置>>=
for (let i = oldHeadPos; i <= oldTailPos; i++) {
    if (this.isValidMapPosition(map, i, x)) {
        map[i][x] = 0;
    }
}
```

```typescript
// <<Rx汽车-清除地图旧位置>>=
for (let i = oldHeadPos; i <= oldTailPos; i++) {
    if (this.isValidMapPosition(map, y, i)) {
        map[y][i] = 0;
    }
}
```

```typescript
// <<Lx汽车-清除地图旧位置>>=
for (let i = oldHeadPos; i <= oldTailPos; i++) {
    if (this.isValidMapPosition(map, y, i)) {
        map[y][i] = 0;
    }
}
```

```typescript
// <<Ux汽车-设置地图新位置>>=
for (let i = newHeadPos; i <= newTailPos; i++) {
    if (this.isValidMapPosition(map, i, x)) {
        map[i][x] = carType;
    }
}
```

```typescript
// <<Rx汽车-设置地图新位置>>=
for (let i = newHeadPos; i <= newTailPos; i++) {
    if (this.isValidMapPosition(map, y, i)) {
        map[y][i] = carType;
    }
}
```

```typescript
// <<Lx汽车-设置地图新位置>>=
for (let i = newHeadPos; i <= newTailPos; i++) {
    if (this.isValidMapPosition(map, y, i)) {
        map[y][i] = carType;
    }
}
```

## 7. 辅助函数：基础设施

```typescript
// <<位置有效性检查函数>>=
private isValidMapPosition(map: number[][], row: number, col: number): boolean {
    return row >= 0 && row < map.length && col >= 0 && col < map[0].length;
}
```

```typescript
// <<动画播放函数>>=
private playCarMoveAnimation(carId: string, direction: 'up' | 'down' | 'right' | 'left'): void {

    const carElement = document.getElementById(carId);
    if (carElement) {
        this.moveCarAnimation(carElement, direction);
    }
}
```

## 8. 程序完整性验证

通过调试信息验证程序的正确性：

```typescript
// <<调试信息输出>>=
console.log('更新后地图状态:', map);
this.updateParkingCount(); // 更新停车计数
this.checkLevelComplete(); // 检查关卡完成状态
```

## 总结

这个literate programming文档展示了Ux汽车点击处理系统的完整结构：

1. **数据结构设计**：清晰定义了汽车信息和移动状态
2. **主程序流程**：从点击事件到移动完成的完整链路
3. **决策逻辑**：复杂的移动状态计算和条件判断
4. **执行机制**：三种不同移动模式的具体实现
5. **连带移动**：确保汽车队列有序的高级功能
6. **状态同步**：维护地图数据与汽车位置的一致性

通过这种文学编程的方式，代码的逻辑结构变得清晰可见，每个组件的职责和相互关系都得到了明确的表达。这不仅有助于理解现有代码，也为后续的维护和扩展提供了良好的基础。