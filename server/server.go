package main

import (
	"gorm.io/driver/sqlite"
	"net/http"
	"time"
	"log"
	"fmt"
	"io"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type Person struct {
	gorm.Model
	Email string
	Name string
	Alias string
	Cals  []Cal `gorm:"foreignKey:Email"`
}

type Cal struct {
	gorm.Model
	ID       string
	Email string
	URL         string
}

var db gorm.DB

func calCacheHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		return
	}

	w.Write([]byte("Not Implemented"))
}

func userHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	alias := "D42"
	params := r.URL.Query()
	fmt.Println(params)
	if r.Method == http.MethodOptions {
		return
	} else if r.Method == http.MethodPost {
		db.Create(&Person{Alias: alias})
	} else if r.Method == http.MethodGet {
		var person Person
		db.First(&person, "person.alias = ?", alias)
	}

	io.WriteString(w, "Cal!")
}

func welcome(w http.ResponseWriter, r *http.Request) {
    io.WriteString(w, "Welcome!")
}

func main() {
	db, err := gorm.Open(sqlite.Open("when.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// Migrate the schema
	db.AutoMigrate(&Person{})
	db.AutoMigrate(&Cal{})
	r := mux.NewRouter()
	const v = "v1" // TODO load from env file
 
	r.HandleFunc("/api/v1/{alias}", userHandler)
	r.HandleFunc("/api/v1/cal/{cal}", userHandler)
	
	srv := &http.Server{
		Handler: r,
		Addr:    "127.0.0.1:5050",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}
