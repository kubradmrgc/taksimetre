import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        System.out.println("TAKSİMETRE PROGRAMI");
        System.out.println("Taksimetre KM başına 2.20 TL tutmaktadır.\n" +
                "Minimum ödenecek tutar 20 TL'dir. 20 TL altında ki ücretlerde yine 20 TL alınacaktır.\n" +
                "Taksimetre açılış ücreti 10 TL'dir.");
        Scanner data = new Scanner(System.in);
        System.out.print("Gidilen yolu km cinsinden yazınız : ");
        int km  = data.nextInt();
        if ((km*2.20+10)<= 20){
            System.out.println("Öednecek tutar 20 TL'dir.");

        }
        else{
            System.out.println("Ödenecek tutar "+(km*2.20+10)+" TL'dir.");
        }
        data.close();


    }
}