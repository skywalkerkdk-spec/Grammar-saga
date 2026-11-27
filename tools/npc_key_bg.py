"""불투명 배경(흰색/연회색 체크무늬)을 가장자리 flood-fill로 투명 처리.
사용: python3 tools/npc_key_bg.py in.png out.png"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def key(src, dst, lo=222, chroma=14):
    im = Image.open(src).convert("RGBA"); a = np.array(im)
    rgb = a[..., :3].astype(int)
    light = (rgb.min(-1) >= lo) & ((rgb.max(-1) - rgb.min(-1)) <= chroma)
    lab, n = ndi.label(light)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    # 가장자리와 이어진 밝은 영역만 배경(캐릭터 안쪽 흰 옷/거품은 보존)
    bg = ndi.binary_dilation(bg, iterations=1) & light
    a[..., 3] = np.where(bg, 0, 255)
    Image.fromarray(a).save(dst)
    print(dst, "투명 %.0f%%" % (bg.mean() * 100))

if __name__ == "__main__":
    key(sys.argv[1], sys.argv[2])
