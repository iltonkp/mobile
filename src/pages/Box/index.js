import React, { Component } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import asyncStorage from "@react-native-community/async-storage";
import ImagePicker from "react-native-image-picker";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import socket from "socket.io-client";

import { distanceInWords } from "date-fns";
import pt from "date-fns/locale/pt";

import Icon from "react-native-vector-icons/MaterialIcons";

import api from "../../services/api";

import styles from "./styles";

export default class Box extends Component {
  state = {
    box: {}
  };

  async componentDidMount() {
    const box = await asyncStorage.getItem("@RocketBox:box");

    this.subscribeToNewFile(box);

    console.log(box);
    const response = await api.get(`boxes/${box}`);

    this.setState({ box: response.data });
  }

  subscribeToNewFile = box => {
    const io = socket("https://omnistack-backend-ilton.herokuapp.com");
    io.emit("connectionRoom", box);
    io.on("file", data => {
      this.setState({
        box: { ...this.state.box, files: [data, ...this.state.box.files] }
      });
    });
  };

  handleUpload = () => {
    ImagePicker.launchImageLibrary({}, async upload => {
      if (upload.error) {
        console.log("image-picker error");
      } else if (upload.didCancel) {
        console.log("canceled by user");
      } else {
        const data = new FormData();

        const [prefix, sufix] = upload.fileName.split(".");
        const ext = sufix.toLocaleLowerCase === "heic" ? "jpg" : sufix;

        data.append("file", {
          uri: upload.uri,
          type: upload.type,
          name: `${prefix}.${sufix}`
        });

        api.post(`boxes/${this.state.box._id}/files`, data);
      }
    });
  };

  openFile = async file => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`;

      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: filePath
      });

      await FileViewer.open(filePath);
    } catch (err) {
      console.log("Arquivo não suportado");
    }
  };

  renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => this.openFile(item)} style={styles.file}>
      <View style={styles.fileInfo}>
        <Icon name="insert-drive-file" size={24} color="#A5CFFF" />
        <Text style={styles.fileText}>{item.title}</Text>
      </View>

      <Text style={styles.fileData}>
        há{" "}
        {distanceInWords(item.createdAt, new Date(), {
          locale: pt
        })}
      </Text>
    </TouchableOpacity>
  );

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.boxTitle}> {this.state.box.title}</Text>

        <FlatList
          style={styles.list}
          data={this.state.box.files}
          keyExtractor={file => file._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={this.renderItem}
        />

        <TouchableOpacity style={styles.fab} onPress={this.handleUpload}>
          <Icon name="cloud-upload" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }
}
