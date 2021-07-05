# PlacesCNN to predict the scene category, attribute, and class activation map in a single pass
# by Bolei Zhou, sep 2, 2017
# updated, making it compatible to pytorch 1.x in a hacky way

# PlacesCNN for scene classification
#
# by Bolei Zhou
# last modified by Bolei Zhou, Dec.27, 2017 with latest pytorch and torchvision (upgrade your torchvision please if there is trn.Resize error)
import io
import os
import numpy as np
import wget
import torch
from torch.autograd import Variable as V
import torchvision.models as models
from torchvision import transforms as trn
from torch.nn import functional as F
from PIL import Image
import sys
sys.path.append("./")
# hacky way to deal with the Pytorch 1.0 update
def recursion_change_bn(module):
    if isinstance(module, torch.nn.BatchNorm2d):
        module.track_running_stats = 1
    else:
        for i, (name, module1) in enumerate(module._modules.items()):
            module1 = recursion_change_bn(module1)
    return module

def load_labels():
    # prepare all the labels
    # scene category relevant
    file_name_category = 'categories_places365.txt'
    if not os.access(file_name_category, os.W_OK):
        synset_url = 'https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt'
        wget.download(synset_url)
    classes = list()
    with open(file_name_category) as class_file:
        for line in class_file:
            classes.append(line.strip().split(' ')[0][3:])
    classes = tuple(classes)

    # indoor and outdoor relevant
    file_name_IO = 'IO_places365.txt'
    if not os.access(file_name_IO, os.W_OK):
        synset_url = 'https://raw.githubusercontent.com/csailvision/places365/master/IO_places365.txt'
        wget.download(synset_url)
    with open(file_name_IO) as f:
        lines = f.readlines()
        labels_IO = []
        for line in lines:
            items = line.rstrip().split()
            labels_IO.append(int(items[-1]) -1) # 0 is indoor, 1 is outdoor
    labels_IO = np.array(labels_IO)

    # scene attribute relevant
    file_name_attribute = 'labels_sunattribute.txt'
    if not os.access(file_name_attribute, os.W_OK):
        synset_url = 'https://raw.githubusercontent.com/csailvision/places365/master/labels_sunattribute.txt'
        wget.download(synset_url)
    with open(file_name_attribute) as f:
        lines = f.readlines()
        labels_attribute = [item.rstrip() for item in lines]
    file_name_W = 'W_sceneattribute_wideresnet18.npy'
    if not os.access(file_name_W, os.W_OK):
        synset_url = 'http://places2.csail.mit.edu/models_places365/W_sceneattribute_wideresnet18.npy'
        wget.download(synset_url)
    W_attribute = np.load(file_name_W)

    return classes, labels_IO, labels_attribute, W_attribute

features_blob=None
def hook_feature(module, input, output):
    global features_blob
    features_blob=np.squeeze(output.data.cpu().numpy())

def load_model_wideresnet18():
    # this model has a last conv feature map as 14x14
    model_file = 'wideresnet18_places365.pth.tar'
    if not os.access(model_file, os.W_OK):
        wget.download("http://places2.csail.mit.edu/models_places365/"+ model_file)
        wget.download("https://raw.githubusercontent.com/csailvision/places365/master/wideresnet.py")

    import wideresnet
    model = wideresnet.resnet18(num_classes=365)
    checkpoint = torch.load(model_file, map_location=lambda storage, loc: storage)
    state_dict = {str.replace(k,'module.',''): v for k,v in checkpoint['state_dict'].items()}
    model.load_state_dict(state_dict)
    
    # hacky way to deal with the upgraded batchnorm2D and avgpool layers...
    for i, (name, module) in enumerate(model._modules.items()):
        module = recursion_change_bn(model)
    model.avgpool = torch.nn.AvgPool2d(kernel_size=14, stride=1, padding=0)

    model.eval()
    # hook the feature extractor
    features_names = ['layer4','avgpool'] # this is the last conv layer of the resnet
    for name in features_names:
        model._modules.get(name).register_forward_hook(hook_feature)
    return model

def returnTF_wide_rs_18():
# load the image transformer
    tf = trn.Compose([
        trn.Resize((224,224)),
        trn.ToTensor(),
        trn.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return tf

def returnTF_rs50():
# load the image transformer
    tf = trn.Compose([
        trn.Resize((256,256)),
        trn.CenterCrop(224),
        trn.ToTensor(),
        trn.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    return tf

def load_model_resnet50():
    arch = 'resnet50'
    # load the pre-trained weights
    model_file = '%s_places365.pth.tar' % arch
    if not os.access(model_file, os.W_OK):
        weight_url = 'http://places2.csail.mit.edu/models_places365/' + model_file
        wget.download(weight_url)
    model = models.__dict__[arch](num_classes=365)
    checkpoint = torch.load(model_file, map_location=lambda storage, loc: storage)
    state_dict = {str.replace(k,'module.',''): v for k,v in checkpoint['state_dict'].items()}
    model.load_state_dict(state_dict)
    model.eval()
    return model

classes, labels_IO, labels_attribute, W_attribute = load_labels()


wideresnet18=load_model_wideresnet18()
tf_wideresnet18=returnTF_wide_rs_18()

def wideresnet18_tag(img):
    tags=[]
    input_img_wideresnet18 = V(tf_wideresnet18(img).unsqueeze(0))
    logit = wideresnet18.forward(input_img_wideresnet18)
    h_x = F.softmax(logit, 1).data.squeeze()
    _, idx = h_x.sort(0, True)
    idx = idx.numpy()
    responses_attribute = W_attribute.dot(features_blob)
    idx_a = np.argwhere(responses_attribute > 0).flatten()
    for x in idx_a:
        tags.append(labels_attribute[x])
    return tags
    # print(idx_a)
    # print('--SCENE ATTRIBUTES:')
    # for x in idx_a:
    #     print(f"{labels_attribute[x]}: {responses_attribute[x]}")
    # print(', '.join([labels_attribute[idx_a[i]] for i in range(len(idx_a))]))


resnet50 =load_model_resnet50()
tf_centre_crop=returnTF_rs50()

def resnet50_tag(img):
    tags=[]
    input_img_resnet50 = V(tf_centre_crop(img).unsqueeze(0))
    logit = resnet50.forward(input_img_resnet50)
    h_x = F.softmax(logit, 1).data.squeeze()
    probs, idx = h_x.sort(0, True)
    io_image = np.mean(labels_IO[idx[:10]]) # vote for the indoor or outdoor
    if io_image < 0.5:
        tags.append("indoor")
    else:
        tags.append("outdoor")
    
    # output the prediction
    for i in range(len(probs)):
        if probs[i] > 0.2:
            # print(probs[i])
            # print(classes[idx[i]])
            tags.append(classes[idx[i]])
    return tags

def tag(img):
    if isinstance(img, str):
        img = Image.open(img).convert('RGB')
    else:
        img = Image.open(io.BytesIO(img)).convert("RGB")
    tags1=wideresnet18_tag(img)
    tags2=resnet50_tag(img)
    all_tags=list(set(tags1 + tags2))
    return all_tags