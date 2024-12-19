function main() {
  let file = null
  try {
    const input = document.querySelector('input')
    const form = document.querySelector('form')
    const loader = document.querySelector('span.loader') as HTMLElement

    if(!input) throw "Cant find input!"
    if(!form) throw "Cant find form!"
    if(!loader) throw "Cant find loader!"

    input.onchange = (e: Event) => {

      const target = e.target as HTMLInputElement;
      file = (target && target.files && target.files.length) ? target.files[0] : null
      
      const button = document.querySelector('button')
      if(!button) throw "Cant find button!"
      if(file !== null) button.removeAttribute('disabled')
        else button.setAttribute('disabled', '')
    }

    form.onsubmit = (e: Event) => {
      loader.style.visibility = 'visible'
      //e.preventDefaul
    }
  }
  catch (err) {
    alert(err)
  }
}

main();