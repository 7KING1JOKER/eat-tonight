---
version: alpha
name: Kitchen Linen
description: 晚饭前的厨房台面。亚麻底上只有墨色字、一条细线和两种状态色。
colors:
  primary: "#2F6B3A"
  secondary: "#5C4D3C"
  tertiary: "#9A4F22"
  neutral: "#F4F1DE"
  ink: "#3C342C"
  muted: "#7A7166"
  line: "#E4DCC8"
  on-primary: "#FFFCF7"
  chrome: "#E8E0C8"
typography:
  dish:
    fontFamily: PingFang SC
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
  section:
    fontFamily: PingFang SC
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.04em
  body:
    fontFamily: PingFang SC
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: PingFang SC
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 2px
  md: 4px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  page: 20px
components:
  chip:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 8px
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 8px
  recipe-ready:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 16px
  recipe-almost:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: 16px
  section-ready:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
  section-almost:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
  group-title:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
  caption:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
  hairline:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
---

## Overview

有机自然加上极简。画面像一张铺开的亚麻布：大面积底色，菜名是唯一的大字，能做与还差只用苔藓绿和陶土橙分开。不画卡片阴影，不铺渐变，不加插画。

人们会记住的一点：选中的食材和「今晚能做」是同一块深苔藓绿，其余都安静。

小程序里用手机自带中文字体，不装字体文件。下面的字号按 375 宽的 px 写，实现时乘 2 变成 rpx。

## Colors

色板取自美学技能里的有机自然，再压暗到浅底上能读清。比例大约是亚麻 60%、墨色和细线 30%、苔藓绿与陶土橙合计 10%。

- **Neutral (#F4F1DE)：** 亚麻底，页面和未选中芯片的底。
- **Chrome (#E8E0C8)：** 顶栏和底栏。比页面深一号，把导航和内容分开。下拉时的窗口底仍是亚麻。
- **Ink (#3C342C)：** 菜名和正文。
- **Secondary (#5C4D3C)：** 泥土棕，只用于分组标题。
- **Muted (#7A7166)：** 来源、用量、说明。
- **Line (#E4DCC8)：** 分组和菜与菜之间的一条线。
- **Primary (#2F6B3A)：** 深苔藓绿。今晚能做、已选食材、已有。白字只能铺在这块绿上。
- **Tertiary (#9A4F22)：** 陶土橙。还差、缺料芯片上的字。不做成大面积底。
- **On-primary (#FFFCF7)：** 绿底上的字。

不做暗色，也不写 `prefers-color-scheme`。

## Typography

字体是苹方和系统无衬线。极简靠字号，不靠另一套展示字体。

- **Dish（22px / 600）：** 菜名，吃啥列表和详情标题。
- **Section（13px / 500）：** 「今晚能做」「还差 1～2 样」。字距略松开。
- **Body（15px / 400）：** 步骤、简介、食材名。
- **Label（12px / 400）：** 来源、缺料、分页。

## Layout

页边距 20px。相关的东西靠近，组与组之间 24px。冰箱的食材横向折行，不做成表格。

吃啥页顶部是搜索。输入为空时才显示冰箱匹配：筛选、今晚能做、还差 1～2 样。输入不为空时，在全部官方菜和我的菜里按菜名或食材名找，菜名命中排在前面，不再按冰箱过滤。窗口不窄于 768px 时四列，手机宽度两列，窄于 300px 时一列。封面是正方形亚麻色块，不接外部图片，右上角不标来源。能做的标题用苔藓绿，还差的标题用陶土橙。搜不到时显示「没有找到这道菜」。

详情仍是一条竖线往下。菜名单独一行，下一行是「官方 / 我的」和份量，再用一条细线隔开简介。已有和还差并排，圆角与吃啥卡片相同，底边分别是苔藓绿和陶土橙。食材一行一个，名字在左、用量在右。步骤序号靠左，正文靠右，中间不画圆牌。说明左边贴一条泥土棕细线。出处只显示站点名，点它打开这道菜的原文；小程序里打不开外链时改为复制。步骤和说明里的成对星号显示为粗体，单星号显示为斜体。用量里的乘号、转义后的星号保持原样。图片标记不显示。

底部留出 `env(safe-area-inset-bottom)`。Tab 用系统栏，不自绘。

## Elevation & Depth

没有投影。层次只靠留白和一条 1px 细线。正方形卡片底部：能做是 2px 苔藓绿，还差是 2px 陶土橙。详情里的已有、还差两块用同样的底边。

骨架屏是三条亚麻上的浅块，没有闪光扫过整页。空态是一个 8px 的方点加原来的那句文案。

## Shapes

圆角 12px。食材芯片不再用胶囊。选中时整块变成苔藓绿，字变成暖白，当帧变色。

## Components

未选中芯片：亚麻底、墨色字、1px 细线。选中芯片：苔藓绿底、暖白字。

吃啥列表按窗口宽度排成四列、两列或一列。封面是正方形亚麻色块，菜名在色块底部，最多两行。缺的食材是陶土橙小字，一行省略。右上角没有来源标签。

分组标题用泥土棕。说明用灰棕。出处链接默认是泥土棕，有鼠标时文字变深并出现下划线。

动效只用 `transform` 和 `opacity`，缓动 `cubic-bezier(0.16, 1, 0.3, 1)`。菜谱卡片第一次出现时用 180ms 上移 8px 并淡入，错开 40ms。冰箱分组滚进视口时同样上移淡入。详情的标题、简介、已有还差、食材、步骤、说明、出处也按这个节奏依次出现。按下时缩到 0.97 左右；出处链接按下时略缩，并保持下划线。有鼠标时，卡片上移 4px，芯片和分类只加深边线，按钮上移 2px，出处链接才出现下划线。没有投影、滚动视差、渐变背景和 Lottie。

## Do's and Don'ts

- 苔藓绿只表示「能做」和「已选」。陶土橙只表示「还差」。
- 三种空态的句子不改：先去冰箱勾食材；没有能做或只差一两样的菜；菜谱暂时没有。
- 不改匹配和云接口。食材不新开分组。菜谱里不留本项目没有的图片和相对路径。
- 不加字体文件、插画包、噪声贴图和紫色或蓝色渐变。
- 不把界面做成另一套产品。勾选、列表、详情、新建菜的路径不变。
