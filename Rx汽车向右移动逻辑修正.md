# Rx汽车向右移动逻辑修正

## 问题描述

用户反映：汽车向右开时，现在只会向右前进1格，不对，正确是尽量往停车场最右边开去。比如lv2关卡一开始时，点击第4/6/7辆汽车，都应该可以直接开到停车场最右边。

## 问题分析

通过分析代码发现，`moveCarRight`方法中的移动逻辑完全错误：

### 错误的代码逻辑
```typescript
let newHeadPosition = parkingInfo.headMap - 1;

// 遍历从车头-1到0，找到新的车头位置
for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
    if (this.isValidMapPosition(map, x, index) && map[x][index] !== 0) {
        break;
    }
    newHeadPosition = index;
}
```

**问题**：这个逻辑是向左移动的逻辑，不是向右移动！

### 需求文档中的正确逻辑

根据`CoCoParkingAiChat.md`第176-180行的需求：

```
（14.2.2）汽车可以向右开，打印"汽车可以向右开"，
        先定义 汽车车头新位置=车头+1，遍历 index 从车头+1 到 mapW-1，
        如果 map[x][index] != 0，跳出循环。
        否则 汽车车头新位置=index。
        循环结束，
        打印 车头会停在汽车车头新位置。
```

## 修正内容

### 1. 修正移动方向逻辑
```typescript
// 修正前：向左移动的错误逻辑
let newHeadPosition = parkingInfo.headMap - 1;
for (let index = parkingInfo.headMap - 1; index >= 0; index--) {

// 修正后：正确的向右移动逻辑
const mapW = map[0].length;
let newHeadPosition = parkingInfo.headMap + 1;
for (let index = parkingInfo.headMap + 1; index < mapW; index++) {
```

### 2. 修正动画距离计算
```typescript
// 修正前：错误的距离计算
const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (oldHead - parkingInfo.headMap);

// 修正后：正确的距离计算
const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (newHeadPosition - oldHead);
```

## 修正后的效果

现在Rx汽车向右移动时会：
1. 从当前车头位置+1开始检查
2. 一直向右移动直到遇到障碍物或到达停车场右边界
3. 尽量移动到停车场最右边的可用位置
4. 正确计算移动距离和播放动画

这样就解决了用户反映的问题：点击第4/6/7辆汽车时，它们会直接开到停车场最右边，而不是只移动1格。

## 文件修改

- **文件**：`e:\MyGitHub\CoCoParking\CoCoParking\assets\GameScripts\CarManager.ts`
- **方法**：`moveCarRight`
- **修改类型**：逻辑错误修正
- **影响**：Rx汽车向右移动行为

## 总结

这是一个严重的逻辑错误，导致Rx汽车"向右移动"实际上执行的是向左移动的逻辑。修正后，汽车的移动行为将与需求规格和用户期望完全一致。