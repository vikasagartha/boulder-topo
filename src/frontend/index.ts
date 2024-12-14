function main() {
  let file = null
  try {
    const input = document.querySelector('input')
    if(!input) throw "Cant find input!"
    input.onchange = (e: Event) => {

      const target = e.target as HTMLInputElement;
      file = (target && target.files && target.files.length) ? target.files[0] : null
      
      const button = document.querySelector('button')
      if(!button) throw "Cant find button!"
      if(file !== null) button.removeAttribute('disabled')
        else button.setAttribute('disabled', '')
    }
  }
  catch (err) {
    alert(err)
  }
}

main();