# 1. Install the ultralytics library in your terminal/notebook
# pip install ultralytics

from ultralytics import YOLO

# 2. Load the downloaded .pt file
model = YOLO("Anzhcs_Breast_size_det_cls_v8_640_y11m.pt")

# 3. Export it to ONNX format (this creates a new .onnx file)
model.export(format="onnx")